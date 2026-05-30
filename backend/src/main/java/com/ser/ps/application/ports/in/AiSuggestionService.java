package com.ser.ps.application.ports.in;

import com.ser.ps.application.dto.TaskSuggestionRequest;
import com.ser.ps.application.dto.TaskSuggestionResponse;

public interface AiSuggestionService {

    TaskSuggestionResponse suggestTask(TaskSuggestionRequest request);
}
