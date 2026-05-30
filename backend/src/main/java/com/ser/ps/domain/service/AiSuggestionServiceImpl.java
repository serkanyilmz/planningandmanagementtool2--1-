package com.ser.ps.domain.service;

import com.ser.ps.application.dto.TaskSuggestionRequest;
import com.ser.ps.application.dto.TaskSuggestionResponse;
import com.ser.ps.application.ports.in.AiSuggestionService;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

public class AiSuggestionServiceImpl implements AiSuggestionService {

    @Override
    public TaskSuggestionResponse suggestTask(TaskSuggestionRequest request) {
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
        if (title.length() < 8) {
            suggestions.add("Use a clearer action-based title so teammates understand the task quickly.");
        }
        if (description.length() < 20) {
            suggestions.add("Add acceptance details or context to make the task easier to complete.");
        }
        if (suggestions.isEmpty()) {
            suggestions.add("The task looks well scoped. Keep the priority and deadline as they are.");
        }

        return new TaskSuggestionResponse(suggestedPriority, deadlineRisk, suggestions);
    }
}
