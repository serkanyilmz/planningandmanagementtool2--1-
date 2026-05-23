package com.ser.ps.application.dto;

public record RegisterRequest(
        String username,
        String email,
        String password,
        String fullName
) {
}
