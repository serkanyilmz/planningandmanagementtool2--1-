import { apiRequest } from "@/api/client"
import type { Board, Task } from "@/types/kanban"

export function getBoards(token: string) {
  return apiRequest<Board[]>("/api/boards", token)
}

export function createBoard(token: string, payload: { title: string; description: string; color: string }) {
  return apiRequest<Board>("/api/boards", token, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateBoard(token: string, boardId: string, payload: { title: string; description: string; color: string }) {
  return apiRequest<Board>(`/api/boards/${boardId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

function taskPayload(task: Partial<Task>) {
  return {
    title: task.title,
    description: task.description || "",
    labelIds: task.labels?.map((label) => label.id) || [],
    priority: task.priority || "medium",
    dueDate: task.dueDate || "",
    assigneeIds: task.assignees?.map((assignee) => assignee.id) || [],
    reminderBefore: task.reminderBefore || "none",
  }
}

export function addTask(token: string, listId: string, task: Omit<Task, "id">) {
  return apiRequest<Board>(`/api/lists/${listId}/tasks`, token, {
    method: "POST",
    body: JSON.stringify(taskPayload(task)),
  })
}

export function updateTask(token: string, taskId: string, task: Partial<Task>) {
  return apiRequest<Board>(`/api/tasks/${taskId}`, token, {
    method: "PUT",
    body: JSON.stringify(taskPayload(task)),
  })
}

export function deleteTask(token: string, taskId: string) {
  return apiRequest<Board>(`/api/tasks/${taskId}`, token, {
    method: "DELETE",
  })
}

export function moveTask(token: string, taskId: string, targetListId: string) {
  return apiRequest<Board>(`/api/tasks/${taskId}/move`, token, {
    method: "PATCH",
    body: JSON.stringify({ targetListId: Number(targetListId) }),
  })
}
