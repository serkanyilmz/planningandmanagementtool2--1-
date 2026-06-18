package com.ser.ps.application.dto;

public record UpdateEmailRequest(
        String currentPassword,
        String email
) {
}
