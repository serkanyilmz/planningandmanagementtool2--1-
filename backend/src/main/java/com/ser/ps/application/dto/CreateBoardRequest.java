package com.ser.ps.application.dto;

public record CreateBoardRequest(
        String title,
        String description,
        String color
) {
}
