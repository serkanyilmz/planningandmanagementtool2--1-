package com.ser.ps.application.dto;

import java.util.List;

public record TaskSuggestionRequest(
        String title,
        String description,
        String dueDate,
        String priority,
        String boardTitle,
        String listTitle,
        List<String> availableLabels
) {
}
