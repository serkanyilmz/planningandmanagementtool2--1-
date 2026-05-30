package com.ser.ps.application.dto;

import java.util.List;

public record BoardDataResponse(
        List<KanbanListResponse> lists
) {
}
