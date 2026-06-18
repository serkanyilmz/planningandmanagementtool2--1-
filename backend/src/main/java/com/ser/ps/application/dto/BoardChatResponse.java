package com.ser.ps.application.dto;

import java.util.List;

public record BoardChatResponse(
        String answer,
        List<String> referencedTasks,
        List<String> suggestedActions,
        List<String> actionCards,
        boolean aiGenerated
) {
}
