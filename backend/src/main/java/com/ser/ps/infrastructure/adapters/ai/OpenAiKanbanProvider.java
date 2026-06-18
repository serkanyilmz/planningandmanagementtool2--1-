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
import org.springframework.web.client.RestClientException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@Order(20)
public class OpenAiKanbanProvider implements AiKanbanProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiKanbanProvider.class);
    private static final String RESPONSES_URL = "https://api.openai.com/v1/responses";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public OpenAiKanbanProvider(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.ai.openai.api-key:}") String apiKey,
            @Value("${app.ai.openai.model:gpt-5.5}") String model
    ) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        log.info("OpenAI provider initialized. apiKeyConfigured={}, model={}", apiKey != null && !apiKey.isBlank(), model);
    }

    @Override
    public Optional<TaskSuggestionResponse> suggestTask(TaskSuggestionRequest request) {
        return requestStructured(
                "Improve this Kanban task. Keep labels limited to availableLabels.",
                request,
                taskSuggestionSchema(),
                TaskSuggestionResponse.class
        );
    }

    @Override
    public Optional<BoardSummaryResponse> summarizeBoard(BoardResponse board) {
        return requestStructured(
                "Summarize this Kanban board and produce practical daily focus advice.",
                board,
                boardSummarySchema(),
                BoardSummaryResponse.class
        );
    }

    @Override
    public Optional<SmartTaskDraftResponse> draftTasks(BoardResponse board, SmartTaskDraftRequest request) {
        return requestStructured(
                "Break the user's goal into 3 to 6 useful Kanban task drafts. Use only labels that exist on the board.",
                Map.of("board", board, "request", request),
                smartTaskDraftSchema(),
                SmartTaskDraftResponse.class
        );
    }

    @Override
    public Optional<BoardChatResponse> chat(BoardResponse board, BoardChatRequest request) {
        return requestStructured(
                "Answer questions about this board. Do not claim to change data; suggest actions for the user to approve.",
                Map.of("board", board, "request", request),
                boardChatSchema(),
                BoardChatResponse.class
        );
    }

    private <T> Optional<T> requestStructured(String instruction, Object payload, Map<String, Object> schema, Class<T> type) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("OPENAI_API_KEY is not configured. Using rule-based AI fallback.");
            return Optional.empty();
        }

        try {
            JsonNode response = restClient.post()
                    .uri(RESPONSES_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> headers.setBearerAuth(apiKey))
                    .body(Map.of(
                            "model", model,
                            "input", List.of(
                                    Map.of(
                                            "role", "system",
                                            "content", """
                                                    You are Planify's project-management AI assistant.
                                                    Be concise, practical, and safe. Never invent board data.
                                                    Return only data that matches the requested JSON schema.
                                                    """
                                    ),
                                    Map.of(
                                            "role", "user",
                                            "content", instruction + "\n\n" + objectMapper.writeValueAsString(payload)
                                    )
                            ),
                            "text", Map.of(
                                    "format", Map.of(
                                            "type", "json_schema",
                                            "name", schema.get("name"),
                                            "strict", true,
                                            "schema", schema.get("schema")
                                    )
                            )
                    ))
                    .retrieve()
                    .body(JsonNode.class);

            Optional<String> outputText = extractOutputText(response);
            if (outputText.isEmpty()) {
                log.warn("OpenAI response did not include output text. Raw response: {}", response);
                return Optional.empty();
            }

            return Optional.of(objectMapper.readValue(outputText.get(), type));
        } catch (JsonProcessingException ex) {
            log.warn("OpenAI response could not be parsed. {}", ex.getMessage());
            return Optional.empty();
        } catch (RestClientException ex) {
            log.warn("OpenAI request failed. {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private Optional<String> extractOutputText(JsonNode response) {
        if (response == null) {
            return Optional.empty();
        }

        JsonNode outputText = response.path("output_text");
        if (!outputText.isMissingNode() && outputText.isTextual()) {
            return Optional.of(outputText.asText());
        }

        for (JsonNode output : response.path("output")) {
            for (JsonNode content : output.path("content")) {
                JsonNode text = content.path("text");
                if (!text.isMissingNode() && text.isTextual()) {
                    return Optional.of(text.asText());
                }
            }
        }

        return Optional.empty();
    }

    private Map<String, Object> taskSuggestionSchema() {
        return namedSchema("task_suggestion", objectSchema(
                Map.ofEntries(
                        Map.entry("suggestedTitle", Map.of("type", "string")),
                        Map.entry("suggestedDescription", Map.of("type", "string")),
                        Map.entry("suggestedPriority", Map.of("type", "string", "enum", List.of("high", "medium", "low"))),
                        Map.entry("deadlineRisk", Map.of("type", "string", "enum", List.of("overdue", "high", "medium", "normal"))),
                        Map.entry("suggestedLabels", arrayOfString()),
                        Map.entry("acceptanceCriteria", arrayOfString()),
                        Map.entry("checklist", arrayOfString()),
                        Map.entry("estimatedEffort", Map.of("type", "string")),
                        Map.entry("riskReason", Map.of("type", "string")),
                        Map.entry("suggestedReminder", Map.of("type", "string", "enum", List.of("none", "1_day", "2_hours", "1_hour"))),
                        Map.entry("suggestions", arrayOfString()),
                        Map.entry("aiGenerated", Map.of("type", "boolean"))
                ),
                List.of(
                        "suggestedTitle",
                        "suggestedDescription",
                        "suggestedPriority",
                        "deadlineRisk",
                        "suggestedLabels",
                        "acceptanceCriteria",
                        "checklist",
                        "estimatedEffort",
                        "riskReason",
                        "suggestedReminder",
                        "suggestions",
                        "aiGenerated"
                )
        ));
    }

    private Map<String, Object> boardSummarySchema() {
        return namedSchema("board_summary", objectSchema(
                Map.ofEntries(
                        Map.entry("summary", Map.of("type", "string")),
                        Map.entry("dailyFocus", arrayOfString()),
                        Map.entry("risks", arrayOfString()),
                        Map.entry("suggestedActions", arrayOfString()),
                        Map.entry("healthScore", Map.of("type", "integer")),
                        Map.entry("riskLevel", Map.of("type", "string", "enum", List.of("Low", "Medium", "High"))),
                        Map.entry("blockedTasks", arrayOfString()),
                        Map.entry("weakTasks", arrayOfString()),
                        Map.entry("unassignedTasks", arrayOfString()),
                        Map.entry("totalTasks", Map.of("type", "integer")),
                        Map.entry("overdueTasks", Map.of("type", "integer")),
                        Map.entry("highPriorityTasks", Map.of("type", "integer")),
                        Map.entry("aiGenerated", Map.of("type", "boolean"))
                ),
                List.of(
                        "summary",
                        "dailyFocus",
                        "risks",
                        "suggestedActions",
                        "healthScore",
                        "riskLevel",
                        "blockedTasks",
                        "weakTasks",
                        "unassignedTasks",
                        "totalTasks",
                        "overdueTasks",
                        "highPriorityTasks",
                        "aiGenerated"
                )
        ));
    }

    private Map<String, Object> smartTaskDraftSchema() {
        return namedSchema("smart_task_draft", objectSchema(
                Map.of(
                        "tasks", Map.of(
                                "type", "array",
                                "items", objectSchema(
                                        Map.of(
                                                "title", Map.of("type", "string"),
                                                "description", Map.of("type", "string"),
                                                "priority", Map.of("type", "string", "enum", List.of("high", "medium", "low")),
                                                "dueDate", Map.of("type", "string"),
                                                "suggestedLabels", arrayOfString(),
                                                "acceptanceCriteria", arrayOfString()
                                        ),
                                        List.of("title", "description", "priority", "dueDate", "suggestedLabels", "acceptanceCriteria")
                                )
                        ),
                        "aiGenerated", Map.of("type", "boolean")
                ),
                List.of("tasks", "aiGenerated")
        ));
    }

    private Map<String, Object> boardChatSchema() {
        return namedSchema("board_chat", objectSchema(
                Map.of(
                        "answer", Map.of("type", "string"),
                        "referencedTasks", arrayOfString(),
                        "suggestedActions", arrayOfString(),
                        "actionCards", arrayOfString(),
                        "aiGenerated", Map.of("type", "boolean")
                ),
                List.of("answer", "referencedTasks", "suggestedActions", "actionCards", "aiGenerated")
        ));
    }

    private Map<String, Object> namedSchema(String name, Map<String, Object> schema) {
        return Map.of("name", name, "schema", schema);
    }

    private Map<String, Object> objectSchema(Map<String, Object> properties, List<String> required) {
        return Map.of(
                "type", "object",
                "properties", properties,
                "required", required,
                "additionalProperties", false
        );
    }

    private Map<String, Object> arrayOfString() {
        return Map.of("type", "array", "items", Map.of("type", "string"));
    }
}
