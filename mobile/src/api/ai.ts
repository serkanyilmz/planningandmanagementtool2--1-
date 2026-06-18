import { apiRequest } from "@/api/client"
import type {
  BoardChatResponse,
  BoardSummaryResponse,
  SmartTaskDraftResponse,
  TaskSuggestionRequest,
  TaskSuggestionResponse,
} from "@/types/ai"

export function suggestTask(token: string, request: TaskSuggestionRequest) {
  return apiRequest<TaskSuggestionResponse>("/api/ai/suggestions/task", token, {
    method: "POST",
    body: JSON.stringify(request),
  })
}

export function summarizeBoard(token: string, boardId: string) {
  return apiRequest<BoardSummaryResponse>(`/api/ai/boards/${boardId}/summary`, token, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export function draftTasks(token: string, boardId: string, goal: string, targetListId: string) {
  return apiRequest<SmartTaskDraftResponse>(`/api/ai/boards/${boardId}/tasks/draft`, token, {
    method: "POST",
    body: JSON.stringify({ goal, targetListId }),
  })
}

export function chatWithBoard(token: string, boardId: string, message: string) {
  return apiRequest<BoardChatResponse>(`/api/ai/boards/${boardId}/chat`, token, {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}
