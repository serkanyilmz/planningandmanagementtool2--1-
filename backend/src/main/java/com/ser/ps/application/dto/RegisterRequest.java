package com.ser.ps.application.dto;

public record RegisterRequest(
        String username,
        String email,
        String password,
        String fullName
) {
    public RegisterRequest normalized() {
        return new RegisterRequest(
                normalize(username),
                normalize(email).toLowerCase(),
                password == null ? "" : password,
                normalize(fullName)
        );
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
