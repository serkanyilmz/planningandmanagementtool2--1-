package com.ser.ps.application.dto;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        Long userId,
        String username,
        String email,
        String fullName,
        String profileImageFileId,
        String profileImageUrl
) {
}
