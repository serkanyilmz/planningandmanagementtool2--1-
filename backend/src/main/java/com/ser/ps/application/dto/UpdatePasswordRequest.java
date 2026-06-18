package com.ser.ps.application.dto;

public record UpdatePasswordRequest(
        String currentPassword,
        String newPassword
) {
}
