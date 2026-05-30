package com.ser.ps.infrastructure.adapters.web;

import com.ser.ps.application.dto.TaskSuggestionRequest;
import com.ser.ps.application.dto.TaskSuggestionResponse;
import com.ser.ps.application.ports.in.AiSuggestionService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiSuggestionService aiSuggestionService;

    public AiController(AiSuggestionService aiSuggestionService) {
        this.aiSuggestionService = aiSuggestionService;
    }

    @PostMapping("/suggestions/task")
    public TaskSuggestionResponse suggestTask(@RequestBody TaskSuggestionRequest request) {
        return aiSuggestionService.suggestTask(request);
    }
}
