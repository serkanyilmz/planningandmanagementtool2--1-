package com.ser.ps.infrastructure.adapters.web;

import com.ser.ps.application.dto.BoardChatRequest;
import com.ser.ps.application.dto.BoardChatResponse;
import com.ser.ps.application.dto.BoardResponse;
import com.ser.ps.application.dto.BoardSummaryResponse;
import com.ser.ps.application.dto.SmartTaskDraftRequest;
import com.ser.ps.application.dto.SmartTaskDraftResponse;
import com.ser.ps.application.dto.TaskSuggestionRequest;
import com.ser.ps.application.dto.TaskSuggestionResponse;
import com.ser.ps.application.ports.in.AiSuggestionService;
import com.ser.ps.application.ports.in.KanbanService;
import java.security.Principal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiSuggestionService aiSuggestionService;
    private final KanbanService kanbanService;

    public AiController(AiSuggestionService aiSuggestionService, KanbanService kanbanService) {
        this.aiSuggestionService = aiSuggestionService;
        this.kanbanService = kanbanService;
    }

    @PostMapping("/suggestions/task")
    public TaskSuggestionResponse suggestTask(@RequestBody TaskSuggestionRequest request) {
        return aiSuggestionService.suggestTask(request);
    }

    @PostMapping("/boards/{boardId}/summary")
    public BoardSummaryResponse summarizeBoard(@PathVariable Long boardId, Principal principal) {
        BoardResponse board = kanbanService.getBoard(boardId, principal.getName());
        return aiSuggestionService.summarizeBoard(board);
    }

    @PostMapping("/boards/{boardId}/tasks/draft")
    public SmartTaskDraftResponse draftTasks(
            @PathVariable Long boardId,
            @RequestBody SmartTaskDraftRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.getBoard(boardId, principal.getName());
        return aiSuggestionService.draftTasks(board, request);
    }

    @PostMapping("/boards/{boardId}/chat")
    public BoardChatResponse chat(
            @PathVariable Long boardId,
            @RequestBody BoardChatRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.getBoard(boardId, principal.getName());
        return aiSuggestionService.chat(board, request);
    }
}
