package com.ser.ps.application.dto;

import java.util.List;

public record TaskSuggestionResponse(
        String suggestedTitle,
        String suggestedDescription,
        String suggestedPriority,
        String deadlineRisk,
        List<String> suggestedLabels,
        List<String> acceptanceCriteria,
        List<String> checklist,
        String estimatedEffort,
        String riskReason,
        String suggestedReminder,
        List<String> suggestions,
        boolean aiGenerated
) {
}
