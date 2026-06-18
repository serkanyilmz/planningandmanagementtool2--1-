package com.ser.ps.application.dto;

import java.util.List;

public record TaskSuggestionRequest(
        String title,
        String description,
        String dueDate,
        String priority,
        String boardId,
        String boardKey,
        String listId,
        String boardTitle,
        String listTitle,
        String taskId,
        String taskKey,
        List<String> availableLabels
) {
}
