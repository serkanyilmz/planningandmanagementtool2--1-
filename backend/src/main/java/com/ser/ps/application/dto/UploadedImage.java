package com.ser.ps.application.dto;

public record UploadedImage(
        String originalFilename,
        String contentType,
        long sizeBytes,
        byte[] data
) {
}
