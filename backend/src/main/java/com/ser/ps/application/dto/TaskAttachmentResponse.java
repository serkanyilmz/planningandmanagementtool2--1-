package com.ser.ps.application.dto;

public record TaskAttachmentResponse(
        String id,
        String fileId,
        String fileName,
        String contentType,
        long sizeBytes,
        String url,
        boolean cover
) {
}
