package com.ser.ps.infrastructure.adapters.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ser.ps.application.dto.BoardChatRequest;
import com.ser.ps.application.dto.BoardChatResponse;
import com.ser.ps.application.dto.BoardResponse;
import com.ser.ps.application.dto.BoardSummaryResponse;
import com.ser.ps.application.dto.SmartTaskDraftRequest;
import com.ser.ps.application.dto.SmartTaskDraftResponse;
import com.ser.ps.application.dto.TaskSuggestionRequest;
import com.ser.ps.application.dto.TaskSuggestionResponse;
import com.ser.ps.application.ports.out.AiKanbanProvider;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@Order(10)
public class GeminiKanbanProvider implements AiKanbanProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiKanbanProvider.class);
    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GeminiKanbanProvider(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.ai.gemini.api-key:}") String apiKey,
            @Value("${app.ai.gemini.model:gemini-3.5-flash}") String model
    ) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        log.info("Gemini provider initialized. apiKeyConfigured={}, model={}", apiKey != null && !apiKey.isBlank(), model);
    }

    @Override
    public Optional<TaskSuggestionResponse> suggestTask(TaskSuggestionRequest request) {
        return requestJson(
                "Improve this Kanban task. Keep labels limited to availableLabels.",
                request,
                taskSuggestionShape(),
                TaskSuggestionResponse.class
        );
    }

    @Override
    public Optional<BoardSummaryResponse> summarizeBoard(BoardResponse board) {
        return requestJson(
                "Summarize this Kanban board and produce practical daily focus advice.",
                board,
                boardSummaryShape(),
                BoardSummaryResponse.class
        );
    }

    @Override
    public Optional<SmartTaskDraftResponse> draftTasks(BoardResponse board, SmartTaskDraftRequest request) {
        return requestJson(
                "Break the user's goal into 3 to 6 useful Kanban task drafts. Use only labels that exist on the board.",
                Map.of("board", board, "request", request),
                smartTaskDraftShape(),
                SmartTaskDraftResponse.class
        );
    }

    @Override
    public Optional<BoardChatResponse> chat(BoardResponse board, BoardChatRequest request) {
        return requestJson(
                "Answer questions about this board. Do not claim to change data; suggest actions for the user to approve.",
                Map.of("board", board, "request", request),
                boardChatShape(),
                BoardChatResponse.class
        );
    }

    private <T> Optional<T> requestJson(String instruction, Object payload, Map<String, Object> responseShape, Class<T> type) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY is not configured. Skipping Gemini provider.");
            return Optional.empty();
        }

        try {
            String prompt = """
                    You are Planify's project-management AI assistant.
                    Be concise, practical, and safe. Never invent board data.
                    Return ONLY valid JSON matching this response shape:
                    %s

                    Instruction:
                    %s

                    Payload:
                    %s
                    """.formatted(
                    objectMapper.writeValueAsString(responseShape),
                    instruction,
                    objectMapper.writeValueAsString(payload)
            );

            JsonNode response = restClient.post()
                    .uri(GEMINI_URL.formatted(model))
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("x-goog-api-key", apiKey)
                    .body(Map.of(
                            "contents", List.of(
                                    Map.of("parts", List.of(Map.of("text", prompt)))
                            ),
                            "generationConfig", Map.of(
                                    "responseMimeType", "application/json"
                            )
                    ))
                    .retrieve()
                    .body(JsonNode.class);

            Optional<String> text = extractText(response);
            if (text.isEmpty()) {
                log.warn("Gemini response did not include text. Raw response: {}", response);
                return Optional.empty();
            }

            return Optional.of(objectMapper.readValue(text.get(), type));
        } catch (JsonProcessingException ex) {
            log.warn("Gemini response could not be parsed. {}", ex.getMessage());
            return Optional.empty();
        } catch (RestClientException ex) {
            log.warn("Gemini request failed. {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private Optional<String> extractText(JsonNode response) {
        if (response == null) {
            return Optional.empty();
        }

        JsonNode text = response.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (text.isTextual()) {
            return Optional.of(text.asText());
        }

        return Optional.empty();
    }

    private Map<String, Object> taskSuggestionShape() {
        return Map.ofEntries(
                Map.entry("suggestedTitle", "string"),
                Map.entry("suggestedDescription", "string"),
                Map.entry("suggestedPriority", "high | medium | low"),
                Map.entry("deadlineRisk", "overdue | high | medium | normal"),
                Map.entry("suggestedLabels", "string[]"),
                Map.entry("acceptanceCriteria", "string[]"),
                Map.entry("checklist", "string[]"),
                Map.entry("estimatedEffort", "string"),
                Map.entry("riskReason", "string"),
                Map.entry("suggestedReminder", "none | 1_day | 2_hours | 1_hour"),
                Map.entry("suggestions", "string[]"),
                Map.entry("aiGenerated", true)
        );
    }

    private Map<String, Object> boardSummaryShape() {
        return Map.ofEntries(
                Map.entry("summary", "string"),
                Map.entry("dailyFocus", "string[]"),
                Map.entry("risks", "string[]"),
                Map.entry("suggestedActions", "string[]"),
                Map.entry("healthScore", "integer 0-100"),
                Map.entry("riskLevel", "Low | Medium | High"),
                Map.entry("blockedTasks", "string[]"),
                Map.entry("weakTasks", "string[]"),
                Map.entry("unassignedTasks", "string[]"),
                Map.entry("totalTasks", "integer"),
                Map.entry("overdueTasks", "integer"),
                Map.entry("highPriorityTasks", "integer"),
                Map.entry("aiGenerated", true)
        );
    }

    private Map<String, Object> smartTaskDraftShape() {
        return Map.of(
                "tasks", List.of(Map.of(
                        "title", "string",
                        "description", "string",
                        "priority", "high | medium | low",
                        "dueDate", "YYYY-MM-DD",
                        "suggestedLabels", "string[]",
                        "acceptanceCriteria", "string[]"
                )),
                "aiGenerated", true
        );
    }

    private Map<String, Object> boardChatShape() {
        return Map.of(
                "answer", "string",
                "referencedTasks", "string[]",
                "suggestedActions", "string[]",
                "actionCards", "string[]",
                "aiGenerated", true
        );
    }
}
