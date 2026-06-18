package com.ser.ps.application.dto;

import java.util.List;

public record BoardSummaryResponse(
        String summary,
        List<String> dailyFocus,
        List<String> risks,
        List<String> suggestedActions,
        int healthScore,
        String riskLevel,
        List<String> blockedTasks,
        List<String> weakTasks,
        List<String> unassignedTasks,
        int totalTasks,
        int overdueTasks,
        int highPriorityTasks,
        boolean aiGenerated
) {
}
