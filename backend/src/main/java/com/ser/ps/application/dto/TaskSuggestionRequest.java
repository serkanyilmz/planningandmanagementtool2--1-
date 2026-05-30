package com.ser.ps.application.dto;

public record TaskSuggestionRequest(
        String title,
        String description,
        String dueDate,
        String priority
) {
}
