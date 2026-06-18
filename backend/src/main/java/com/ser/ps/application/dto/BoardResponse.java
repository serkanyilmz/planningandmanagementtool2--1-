package com.ser.ps.application.dto;

import java.util.List;

public record BoardResponse(
        String id,
        String title,
        String description,
        String color,
        List<String> memberIds,
        List<BoardMemberResponse> members,
        String currentUserRole,
        BoardDataResponse data,
        List<LabelResponse> labels
) {
}
