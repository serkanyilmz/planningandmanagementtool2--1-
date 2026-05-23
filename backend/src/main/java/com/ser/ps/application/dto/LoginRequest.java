package com.ser.ps.application.dto;

public record LoginRequest(
        String usernameOrEmail,
        String password
) {
    public LoginRequest normalized() {
        String normalizedUsernameOrEmail = usernameOrEmail == null ? "" : usernameOrEmail.trim();
        if (normalizedUsernameOrEmail.contains("@")) {
            normalizedUsernameOrEmail = normalizedUsernameOrEmail.toLowerCase();
        }

        return new LoginRequest(
                normalizedUsernameOrEmail,
                password == null ? "" : password
        );
    }
}
