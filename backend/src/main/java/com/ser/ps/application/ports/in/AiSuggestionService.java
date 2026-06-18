package com.ser.ps.application.ports.in;

import com.ser.ps.application.dto.BoardChatRequest;
import com.ser.ps.application.dto.BoardChatResponse;
import com.ser.ps.application.dto.BoardResponse;
import com.ser.ps.application.dto.BoardSummaryResponse;
import com.ser.ps.application.dto.SmartTaskDraftRequest;
import com.ser.ps.application.dto.SmartTaskDraftResponse;
import com.ser.ps.application.dto.TaskSuggestionRequest;
import com.ser.ps.application.dto.TaskSuggestionResponse;

public interface AiSuggestionService {

    TaskSuggestionResponse suggestTask(TaskSuggestionRequest request);

    BoardSummaryResponse summarizeBoard(BoardResponse board);

    SmartTaskDraftResponse draftTasks(BoardResponse board, SmartTaskDraftRequest request);

    BoardChatResponse chat(BoardResponse board, BoardChatRequest request);
}
