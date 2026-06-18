package com.ser.ps.application.dto;

import java.util.List;

public record TaskResponse(
        String id,
        String taskKey,
        String boardId,
        String boardKey,
        String title,
        String description,
        List<LabelResponse> labels,
        String priority,
        String dueDate,
        List<AssigneeResponse> assignees,
        String reminderBefore,
        List<TaskAttachmentResponse> attachments
) {
}
