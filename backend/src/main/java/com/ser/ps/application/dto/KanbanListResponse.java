package com.ser.ps.application.dto;

import java.util.List;

public record KanbanListResponse(
        String id,
        String title,
        List<TaskResponse> tasks
) {
}
