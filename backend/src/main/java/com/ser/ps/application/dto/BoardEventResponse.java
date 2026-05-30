package com.ser.ps.application.dto;

public record BoardEventResponse(
        String type,
        BoardResponse board
) {
}
