package com.ser.ps.application.dto;

import java.util.List;

public record SmartTaskDraftResponse(
        List<SmartTaskDraft> tasks,
        boolean aiGenerated
) {
}
