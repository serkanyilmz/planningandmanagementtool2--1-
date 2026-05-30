package com.ser.ps.application.dto;

import java.util.List;

public record UpdateTaskRequest(
        String title,
        String description,
        List<String> labelIds,
        String priority,
        String dueDate,
        List<String> assigneeIds,
        String reminderBefore
) {
}
