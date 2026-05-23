package com.ser.ps.application.dto;

public record LoginRequest(
        String usernameOrEmail,
        String password
) {
}
