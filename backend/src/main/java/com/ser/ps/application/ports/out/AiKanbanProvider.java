package com.ser.ps.application.ports.out;

import com.ser.ps.application.dto.BoardChatRequest;
import com.ser.ps.application.dto.BoardChatResponse;
import com.ser.ps.application.dto.BoardResponse;
import com.ser.ps.application.dto.BoardSummaryResponse;
import com.ser.ps.application.dto.SmartTaskDraftRequest;
import com.ser.ps.application.dto.SmartTaskDraftResponse;
import com.ser.ps.application.dto.TaskSuggestionRequest;
import com.ser.ps.application.dto.TaskSuggestionResponse;
import java.util.Optional;

public interface AiKanbanProvider {

    Optional<TaskSuggestionResponse> suggestTask(TaskSuggestionRequest request);

    Optional<BoardSummaryResponse> summarizeBoard(BoardResponse board);

    Optional<SmartTaskDraftResponse> draftTasks(BoardResponse board, SmartTaskDraftRequest request);

    Optional<BoardChatResponse> chat(BoardResponse board, BoardChatRequest request);
}
