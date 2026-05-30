package com.ser.ps.application.dto;

import java.util.List;

public record TaskSuggestionResponse(
        String suggestedPriority,
        String deadlineRisk,
        List<String> suggestions
) {
}
