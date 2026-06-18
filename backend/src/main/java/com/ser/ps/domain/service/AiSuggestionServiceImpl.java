package com.ser.ps.domain.service;

import com.ser.ps.application.dto.BoardChatRequest;
import com.ser.ps.application.dto.BoardChatResponse;
import com.ser.ps.application.dto.BoardResponse;
import com.ser.ps.application.dto.BoardSummaryResponse;
import com.ser.ps.application.dto.SmartTaskDraft;
import com.ser.ps.application.dto.SmartTaskDraftRequest;
import com.ser.ps.application.dto.SmartTaskDraftResponse;
import com.ser.ps.application.dto.TaskSuggestionRequest;
import com.ser.ps.application.dto.TaskSuggestionResponse;
import com.ser.ps.application.dto.TaskResponse;
import com.ser.ps.application.ports.in.AiSuggestionService;
import com.ser.ps.application.ports.out.AiKanbanProvider;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AiSuggestionServiceImpl implements AiSuggestionService {

    private static final Logger log = LoggerFactory.getLogger(AiSuggestionServiceImpl.class);

    private final List<AiKanbanProvider> aiKanbanProviders;

    public AiSuggestionServiceImpl() {
        this(Collections.emptyList());
    }

    public AiSuggestionServiceImpl(List<AiKanbanProvider> aiKanbanProviders) {
        this.aiKanbanProviders = aiKanbanProviders;
    }

    @Override
    public TaskSuggestionResponse suggestTask(TaskSuggestionRequest request) {
        return firstAiResponse(provider -> provider.suggestTask(request))
                .orElseGet(() -> ruleBasedTaskSuggestion(request));
    }

    @Override
    public BoardSummaryResponse summarizeBoard(BoardResponse board) {
        return firstAiResponse(provider -> provider.summarizeBoard(board))
                .orElseGet(() -> ruleBasedBoardSummary(board));
    }

    @Override
    public SmartTaskDraftResponse draftTasks(BoardResponse board, SmartTaskDraftRequest request) {
        return firstAiResponse(provider -> provider.draftTasks(board, request))
                .orElseGet(() -> ruleBasedTaskDrafts(request));
    }

    @Override
    public BoardChatResponse chat(BoardResponse board, BoardChatRequest request) {
        return firstAiResponse(provider -> provider.chat(board, request))
                .orElseGet(() -> ruleBasedChat(board, request));
    }

    private <T> Optional<T> firstAiResponse(ProviderCall<T> call) {
        for (AiKanbanProvider provider : aiKanbanProviders) {
            try {
                Optional<T> response = call.execute(provider);
                if (response.isPresent()) {
                    return response;
                }
            } catch (RuntimeException ex) {
                log.warn("{} failed; trying next AI provider or fallback. {}", provider.getClass().getSimpleName(), ex.getMessage());
            }
        }
        return Optional.empty();
    }

    private TaskSuggestionResponse ruleBasedTaskSuggestion(TaskSuggestionRequest request) {
        List<String> suggestions = new ArrayList<>();
        String suggestedPriority = request.priority() == null || request.priority().isBlank()
                ? "medium"
                : request.priority().toLowerCase();
        String deadlineRisk = "normal";

        if (request.dueDate() != null && !request.dueDate().isBlank()) {
            long daysUntilDue = ChronoUnit.DAYS.between(LocalDate.now(), LocalDate.parse(request.dueDate()));
            if (daysUntilDue < 0) {
                deadlineRisk = "overdue";
                suggestedPriority = "high";
                suggestions.add("This task is overdue. Move it to the top of the board or split it into smaller tasks.");
            } else if (daysUntilDue <= 2) {
                deadlineRisk = "high";
                suggestedPriority = "high";
                suggestions.add("The deadline is close. Set a short reminder and avoid adding more work before this task.");
            } else if (daysUntilDue <= 7) {
                deadlineRisk = "medium";
                if ("low".equals(suggestedPriority)) {
                    suggestedPriority = "medium";
                }
                suggestions.add("The deadline is within a week. Keep this task visible in the active workflow.");
            }
        }

        String title = request.title() == null ? "" : request.title().trim();
        String description = request.description() == null ? "" : request.description().trim();
        String suggestedTitle = improveTitle(title);
        String suggestedDescription = improveDescription(suggestedTitle, description);
        List<String> acceptanceCriteria = acceptanceCriteriaFor(suggestedTitle);
        List<String> checklist = checklistFor(suggestedTitle);
        String riskReason = riskReason(deadlineRisk, description);
        String suggestedReminder = "high".equals(deadlineRisk) || "overdue".equals(deadlineRisk) ? "1_hour" : "1_day";
        String taskReference = taskReference(request);

        if (title.length() < 8) {
            suggestions.add("Use a clearer action-based title so teammates understand the task quickly.");
        }
        if (description.length() < 20) {
            suggestions.add("Add acceptance details or context to make the task easier to complete.");
        }
        if (suggestions.isEmpty()) {
            suggestions.add("The task looks well scoped. Keep the priority and deadline as they are.");
        }
        if (!taskReference.isBlank()) {
            suggestions.add(0, "Reference " + taskReference + " when discussing this task with the team.");
        }

        return new TaskSuggestionResponse(
                suggestedTitle,
                taskReference.isBlank() ? suggestedDescription : suggestedDescription + "\n\nReference: " + taskReference,
                suggestedPriority,
                deadlineRisk,
                Collections.emptyList(),
                acceptanceCriteria,
                checklist,
                "1-2 days",
                riskReason,
                suggestedReminder,
                suggestions,
                false
        );
    }

    private String improveTitle(String title) {
        if (title == null || title.isBlank()) {
            return "Define and complete task";
        }

        String normalizedTitle = title.trim();
        if (normalizedTitle.toLowerCase().startsWith("create ")
                || normalizedTitle.toLowerCase().startsWith("implement ")
                || normalizedTitle.toLowerCase().startsWith("prepare ")
                || normalizedTitle.toLowerCase().startsWith("build ")) {
            return normalizedTitle;
        }

        return "Create " + normalizedTitle;
    }

    private String improveDescription(String title, String description) {
        String normalizedDescription = description == null ? "" : description.trim();
        if (normalizedDescription.length() >= 80) {
            return normalizedDescription;
        }

        String base = normalizedDescription.isBlank()
                ? "Complete the work described by this task."
                : normalizedDescription;

        return base + "\n\nAcceptance criteria:\n"
                + "- Scope is clear and actionable.\n"
                + "- Required steps are documented before moving the task to Done.\n"
                + "- The result is reviewed and tested.\n"
                + "- Task outcome matches: " + title + ".";
    }

    private List<String> acceptanceCriteriaFor(String title) {
        return List.of(
                "The task has a clear, testable outcome.",
                "Important edge cases or constraints are documented.",
                "The completed result can be reviewed against: " + title + "."
        );
    }

    private List<String> checklistFor(String title) {
        return List.of(
                "Clarify scope for " + title,
                "Implement the core work",
                "Review the result",
                "Move the task to Done after validation"
        );
    }

    private String riskReason(String deadlineRisk, String description) {
        if ("overdue".equals(deadlineRisk)) {
            return "The due date has already passed, so the task may block related work.";
        }
        if ("high".equals(deadlineRisk)) {
            return "The due date is close, so the task should be kept visible and scoped tightly.";
        }
        if (description == null || description.length() < 40) {
            return "The description is short, so the expected outcome may be unclear.";
        }
        return "No major risk detected from the current task details.";
    }

    private BoardSummaryResponse ruleBasedBoardSummary(BoardResponse board) {
        List<TaskWithList> tasks = tasks(board);
        int totalTasks = tasks.size();
        int overdueTasks = (int) tasks.stream().filter(task -> isOverdue(task.task())).count();
        int highPriorityTasks = (int) tasks.stream().filter(task -> "high".equalsIgnoreCase(task.task().priority())).count();
        List<String> blockedTasks = tasks.stream()
                .filter(task -> containsAny(task.task().title(), "block", "blocked", "stuck", "waiting")
                        || containsAny(task.task().description(), "block", "blocked", "stuck", "waiting"))
                .map(task -> taskLabel(task.task()) + " " + task.task().title())
                .limit(5)
                .toList();
        List<String> weakTasks = tasks.stream()
                .filter(task -> task.task().description() == null || task.task().description().trim().length() < 25)
                .map(task -> taskLabel(task.task()) + " " + task.task().title())
                .limit(5)
                .toList();
        List<String> unassignedTasks = tasks.stream()
                .filter(task -> task.task().assignees() == null || task.task().assignees().isEmpty())
                .map(task -> taskLabel(task.task()) + " " + task.task().title())
                .limit(5)
                .toList();
        int healthScore = Math.max(0, 100 - overdueTasks * 12 - highPriorityTasks * 4 - weakTasks.size() * 5 - unassignedTasks.size() * 3);
        String riskLevel = healthScore >= 80 ? "Low" : healthScore >= 55 ? "Medium" : "High";

        List<String> focus = tasks.stream()
                .sorted(Comparator
                        .comparing((TaskWithList task) -> isOverdue(task.task()) ? 0 : 1)
                        .thenComparing(task -> dueDateOrMax(task.task().dueDate())))
                .limit(5)
                .map(task -> taskLabel(task.task()) + " " + task.task().title() + " (" + task.listTitle() + ")")
                .toList();

        List<String> risks = new ArrayList<>();
        if (overdueTasks > 0) {
            risks.add(overdueTasks + " task(s) are overdue.");
        }
        if (highPriorityTasks > 0) {
            risks.add(highPriorityTasks + " high priority task(s) need attention.");
        }
        if (risks.isEmpty()) {
            risks.add("No urgent board risks detected.");
        }

        List<String> actions = new ArrayList<>();
        actions.add("Review the daily focus list before adding new work.");
        if (overdueTasks > 0) {
            actions.add("Move overdue work to the top of active lists or split it into smaller tasks.");
        }
                if (totalTasks == 0) {
            actions.add("Create the first tasks for this board.");
        }

        return new BoardSummaryResponse(
                board.title() + " has " + totalTasks + " task(s), " + overdueTasks + " overdue, and "
                        + highPriorityTasks + " high priority.",
                focus,
                risks,
                actions,
                healthScore,
                riskLevel,
                blockedTasks,
                weakTasks,
                unassignedTasks,
                totalTasks,
                overdueTasks,
                highPriorityTasks,
                false
        );
    }

    private SmartTaskDraftResponse ruleBasedTaskDrafts(SmartTaskDraftRequest request) {
        String goal = request.goal() == null || request.goal().isBlank() ? "Complete the requested work" : request.goal().trim();
        LocalDate dueDate = LocalDate.now().plusDays(7);
        return new SmartTaskDraftResponse(List.of(
                new SmartTaskDraft(
                        "Clarify scope for " + goal,
                        "Define the expected outcome, constraints, and acceptance criteria before implementation starts.",
                        "medium",
                        dueDate.toString(),
                        Collections.emptyList(),
                        Collections.emptyList()
                ),
                new SmartTaskDraft(
                        "Implement " + goal,
                        "Build the core workflow and connect it to the existing board process.",
                        "high",
                        dueDate.plusDays(2).toString(),
                        Collections.emptyList(),
                        Collections.emptyList()
                ),
                new SmartTaskDraft(
                        "Review and test " + goal,
                        "Verify the result with realistic data and fix issues before moving the work to Done.",
                        "medium",
                        dueDate.plusDays(4).toString(),
                        Collections.emptyList(),
                        Collections.emptyList()
                )
        ), false);
    }

    private BoardChatResponse ruleBasedChat(BoardResponse board, BoardChatRequest request) {
        BoardSummaryResponse summary = ruleBasedBoardSummary(board);
        String message = request.message() == null ? "" : request.message().trim();
        String answer = "Board snapshot: " + summary.summary();
        if (!message.isBlank()) {
            answer += " For your question, start with the daily focus items and check overdue/high priority work first.";
        }

        return new BoardChatResponse(
                answer,
                summary.dailyFocus(),
                summary.suggestedActions(),
                summary.suggestedActions(),
                false
        );
    }

    private List<TaskWithList> tasks(BoardResponse board) {
        return board.data().lists().stream()
                .flatMap(list -> list.tasks().stream().map(task -> new TaskWithList(list.title(), task)))
                .toList();
    }

    private boolean isOverdue(TaskResponse task) {
        return dueDateOrMax(task.dueDate()).isBefore(LocalDate.now());
    }

    private LocalDate dueDateOrMax(String dueDate) {
        try {
            return dueDate == null || dueDate.isBlank() ? LocalDate.MAX : LocalDate.parse(dueDate);
        } catch (RuntimeException ex) {
            return LocalDate.MAX;
        }
    }

    private boolean containsAny(String value, String... terms) {
        if (value == null) {
            return false;
        }
        String normalized = value.toLowerCase();
        for (String term : terms) {
            if (normalized.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private String taskReference(TaskSuggestionRequest request) {
        if (request.taskKey() != null && !request.taskKey().isBlank()) {
            return request.taskKey().trim();
        }
        if (request.boardKey() != null && !request.boardKey().isBlank()
                && request.taskId() != null && !request.taskId().isBlank()) {
            return request.boardKey().trim() + "-TASK-" + request.taskId().trim();
        }
        if (request.taskId() != null && !request.taskId().isBlank()) {
            return "TASK-" + request.taskId().trim();
        }
        if (request.boardKey() != null && !request.boardKey().isBlank()
                && request.listId() != null && !request.listId().isBlank()) {
            return request.boardKey().trim() + "-LIST-" + request.listId().trim();
        }
        return request.boardKey() == null ? "" : request.boardKey().trim();
    }

    private String taskLabel(TaskResponse task) {
        if (task.taskKey() != null && !task.taskKey().isBlank()) {
            return "[" + task.taskKey() + "]";
        }
        return "[TASK-" + task.id() + "]";
    }

    private record TaskWithList(String listTitle, TaskResponse task) {
    }

    @FunctionalInterface
    private interface ProviderCall<T> {
        Optional<T> execute(AiKanbanProvider provider);
    }
}
