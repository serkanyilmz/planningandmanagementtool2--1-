package com.ser.ps.application.dto;

import java.util.List;

public record SmartTaskDraft(
        String title,
        String description,
        String priority,
        String dueDate,
        List<String> suggestedLabels,
        List<String> acceptanceCriteria
) {
}
