package com.ser.ps.application.dto;

public record BoardMemberResponse(
        String id,
        String name,
        String email,
        String avatar,
        String role
) {
}
