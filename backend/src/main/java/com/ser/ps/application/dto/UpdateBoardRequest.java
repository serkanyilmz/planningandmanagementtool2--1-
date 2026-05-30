package com.ser.ps.application.dto;

public record UpdateBoardRequest(
        String title,
        String description,
        String color
) {
}
