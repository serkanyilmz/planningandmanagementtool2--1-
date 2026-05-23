package com.ser.ps.application.dto;

public record AuthResponse(
        String token,
        Long userId,
        String username,
        String email,
        String fullName
) {
}
