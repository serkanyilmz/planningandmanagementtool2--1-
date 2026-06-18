"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { Client } from "@stomp/stompjs"
import type { BoardData, Task, List, Label, BoardMember } from "@/types/kanban"
import { useAuth } from "@/contexts/auth-context"
import { apiRequest } from "@/lib/api-client"

export interface Board {
  id: string
  title: string
  description: string
  color: string
  memberIds: string[]
  members?: BoardMember[]
  currentUserRole?: "admin" | "member"
  data: BoardData
  labels: Label[]
}

interface BoardContextType {
  boards: Board[]
  isLoading: boolean
  refreshBoards: () => Promise<void>
  createBoard: (title: string, color: string, creatorId: string) => Promise<Board | null>
  getBoard: (id: string) => Board | undefined
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>
  deleteBoard: (id: string) => Promise<void>
  addMemberToBoard: (boardId: string, userId: string) => Promise<void>
  updateBoardMemberRole: (boardId: string, userId: string, role: "admin" | "member") => Promise<void>
  removeMemberFromBoard: (boardId: string, userId: string) => Promise<void>
  getBoardsForUser: (userId: string) => Board[]
  addList: (boardId: string, title: string) => Promise<void>
  reorderLists: (boardId: string, listIds: string[]) => Promise<void>
  renameList: (boardId: string, listId: string, newTitle: string) => Promise<void>
  deleteList: (boardId: string, listId: string) => Promise<void>
  clearListTasks: (boardId: string, listId: string) => Promise<void>
  addTask: (boardId: string, listId: string, task: Omit<Task, "id">) => Promise<Task | null>
  updateTask: (boardId: string, listId: string, taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (boardId: string, listId: string, taskId: string) => Promise<void>
  moveTask: (boardId: string, fromListId: string, toListId: string, taskId: string) => Promise<void>
  addTaskAttachment: (boardId: string, taskId: string, file: File) => Promise<void>
  setTaskAttachmentCover: (boardId: string, taskId: string, attachmentId: string) => Promise<void>
  deleteTaskAttachment: (boardId: string, taskId: string, attachmentId: string) => Promise<void>
  addLabelToBoard: (boardId: string, name: string, color: string) => Promise<Label | null>
  updateBoardLabel: (boardId: string, labelId: string, updates: Partial<Label>) => Promise<void>
  deleteBoardLabel: (boardId: string, labelId: string) => Promise<void>
}

const BoardContext = createContext<BoardContextType | undefined>(undefined)
const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws").replace(/\/$/, "")

function isBoard(value: unknown): value is Board {
  const board = value as Partial<Board> | null
  return Boolean(
    board &&
      typeof board.id === "string" &&
      typeof board.title === "string" &&
      board.data &&
      Array.isArray(board.data.lists) &&
      Array.isArray(board.labels) &&
      Array.isArray(board.memberIds),
  )
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

export function BoardProvider({ children }: { children: ReactNode }) {
  const { token, currentUser } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const boardIds = boards.map((board) => board.id).sort().join(",")

  const replaceBoard = useCallback((updatedBoard: Board) => {
    if (!isBoard(updatedBoard)) {
      console.warn("Ignoring invalid board payload", updatedBoard)
      return
    }
    setBoards((prev) => {
      const exists = prev.some((board) => board.id === updatedBoard.id)
      if (!exists) {
        return [...prev, updatedBoard]
      }
      return prev.map((board) => (board.id === updatedBoard.id ? updatedBoard : board))
    })
  }, [])

  const refreshBoards = useCallback(async () => {
    if (!token) {
      setBoards([])
      return
    }

    setIsLoading(true)
    try {
      const loadedBoards = await apiRequest<Board[]>("/api/boards", token)
      setBoards(loadedBoards.filter(isBoard))
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void refreshBoards()
  }, [refreshBoards, currentUser?.id])

  useEffect(() => {
    if (!token || !boardIds) return

    const client = new Client({
      brokerURL: WS_BASE_URL,
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        boardIds.split(",").forEach((boardId) => {
          client.subscribe(`/topic/boards/${boardId}`, (message) => {
            const event = JSON.parse(message.body) as { type: string; board: Board }
            if (event.board) {
              replaceBoard(event.board)
            }
          })
        })
      },
    })

    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [token, boardIds, replaceBoard])

  const createBoard = useCallback(
    async (title: string, color: string) => {
      if (!token) return null
      const board = await apiRequest<Board>("/api/boards", token, {
        method: "POST",
        body: JSON.stringify({ title, color, description: "New board description" }),
      })
      replaceBoard(board)
      return board
    },
    [token, replaceBoard],
  )

  const getBoard = useCallback(
    (id: string) => {
      return boards.find((board) => board.id === id)
    },
    [boards],
  )

  const updateBoard = useCallback(
    async (id: string, updates: Partial<Board>) => {
      if (!token) return
      const current = boards.find((board) => board.id === id)
      const board = await apiRequest<Board>(`/api/boards/${id}`, token, {
        method: "PUT",
        body: JSON.stringify({
          title: updates.title ?? current?.title,
          description: updates.description ?? current?.description ?? "",
          color: updates.color ?? current?.color,
        }),
      })
      replaceBoard(board)
    },
    [token, boards, replaceBoard],
  )

  const deleteBoard = useCallback(
    async (id: string) => {
      if (!token) return
      await apiRequest<void>(`/api/boards/${id}`, token, { method: "DELETE" })
      setBoards((prev) => prev.filter((board) => board.id !== id))
    },
    [token],
  )

  const addMemberToBoard = useCallback(
    async (boardId: string, userId: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/boards/${boardId}/members`, token, {
        method: "POST",
        body: JSON.stringify({ userId: Number(userId) }),
      })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const updateBoardMemberRole = useCallback(
    async (boardId: string, userId: string, role: "admin" | "member") => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/boards/${boardId}/members/${userId}/role`, token, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const removeMemberFromBoard = useCallback(
    async (boardId: string, userId: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/boards/${boardId}/members/${userId}`, token, { method: "DELETE" })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const getBoardsForUser = useCallback(
    (userId: string) => {
      return boards.filter((board) => board.memberIds.includes(userId))
    },
    [boards],
  )

  const addList = useCallback(
    async (boardId: string, title: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/boards/${boardId}/lists`, token, {
        method: "POST",
        body: JSON.stringify({ title }),
      })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const reorderLists = useCallback(
    async (boardId: string, listIds: string[]) => {
      if (!token) return
      const currentBoard = boards.find((board) => board.id === boardId)
      if (currentBoard) {
        const byId = new Map(currentBoard.data.lists.map((list) => [list.id, list]))
        setBoards((prev) =>
          prev.map((board) =>
            board.id === boardId ? { ...board, data: { lists: listIds.map((listId) => byId.get(listId)).filter(Boolean) as List[] } } : board,
          ),
        )
      }
      try {
        const board = await apiRequest<Board>(`/api/boards/${boardId}/lists/reorder`, token, {
          method: "PATCH",
          body: JSON.stringify({ listIds: listIds.map((id) => Number(id)) }),
        })
        replaceBoard(board)
      } catch (error) {
        if (currentBoard) {
          replaceBoard(currentBoard)
        }
        throw error
      }
    },
    [token, boards, replaceBoard],
  )

  const renameList = useCallback(
    async (_boardId: string, listId: string, newTitle: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/lists/${listId}`, token, {
        method: "PUT",
        body: JSON.stringify({ title: newTitle }),
      })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const deleteList = useCallback(
    async (_boardId: string, listId: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/lists/${listId}`, token, { method: "DELETE" })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const clearListTasks = useCallback(
    async (_boardId: string, listId: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/lists/${listId}/tasks`, token, { method: "DELETE" })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const addTask = useCallback(
    async (_boardId: string, listId: string, task: Omit<Task, "id">) => {
      if (!token) return null
      const board = await apiRequest<Board>(`/api/lists/${listId}/tasks`, token, {
        method: "POST",
        body: JSON.stringify(taskPayload(task)),
      })
      replaceBoard(board)
      const targetList = board.data.lists.find((list) => list.id === listId)
      return targetList?.tasks[targetList.tasks.length - 1] || null
    },
    [token, replaceBoard],
  )

  const updateTask = useCallback(
    async (boardId: string, listId: string, taskId: string, updates: Partial<Task>) => {
      if (!token) return
      const currentBoard = boards.find((board) => board.id === boardId)
      const currentTask = currentBoard?.data.lists
        .find((list) => list.id === listId)
        ?.tasks.find((task) => task.id === taskId)
      const board = await apiRequest<Board>(`/api/tasks/${taskId}`, token, {
        method: "PUT",
        body: JSON.stringify(taskPayload({ ...currentTask, ...updates })),
      })
      replaceBoard(board)
    },
    [token, boards, replaceBoard],
  )

  const deleteTask = useCallback(
    async (_boardId: string, _listId: string, taskId: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/tasks/${taskId}`, token, { method: "DELETE" })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const moveTask = useCallback(
    async (_boardId: string, _fromListId: string, toListId: string, taskId: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/tasks/${taskId}/move`, token, {
        method: "PATCH",
        body: JSON.stringify({ targetListId: Number(toListId) }),
      })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const addTaskAttachment = useCallback(
    async (_boardId: string, taskId: string, file: File) => {
      if (!token) return
      const formData = new FormData()
      formData.append("file", file)
      const board = await apiRequest<Board>(`/api/tasks/${taskId}/attachments`, token, {
        method: "POST",
        body: formData,
      })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const setTaskAttachmentCover = useCallback(
    async (_boardId: string, taskId: string, attachmentId: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/tasks/${taskId}/attachments/${attachmentId}/cover`, token, { method: "PATCH" })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const deleteTaskAttachment = useCallback(
    async (_boardId: string, taskId: string, attachmentId: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/tasks/${taskId}/attachments/${attachmentId}`, token, { method: "DELETE" })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const addLabelToBoard = useCallback(
    async (boardId: string, name: string, color: string) => {
      if (!token) return null
      const board = await apiRequest<Board>(`/api/boards/${boardId}/labels`, token, {
        method: "POST",
        body: JSON.stringify({ name, color }),
      })
      replaceBoard(board)
      return board.labels.find((label) => label.name === name && label.color === color) || null
    },
    [token, replaceBoard],
  )

  const updateBoardLabel = useCallback(
    async (_boardId: string, labelId: string, updates: Partial<Label>) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/labels/${labelId}`, token, {
        method: "PUT",
        body: JSON.stringify({ name: updates.name, color: updates.color }),
      })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  const deleteBoardLabel = useCallback(
    async (_boardId: string, labelId: string) => {
      if (!token) return
      const board = await apiRequest<Board>(`/api/labels/${labelId}`, token, { method: "DELETE" })
      replaceBoard(board)
    },
    [token, replaceBoard],
  )

  return (
    <BoardContext.Provider
      value={{
        boards,
        isLoading,
        refreshBoards,
        createBoard,
        getBoard,
        updateBoard,
        deleteBoard,
        addMemberToBoard,
        updateBoardMemberRole,
        removeMemberFromBoard,
        getBoardsForUser,
        addList,
        reorderLists,
        renameList,
        deleteList,
        clearListTasks,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        addTaskAttachment,
        setTaskAttachmentCover,
        deleteTaskAttachment,
        addLabelToBoard,
        updateBoardLabel,
        deleteBoardLabel,
      }}
    >
      {children}
    </BoardContext.Provider>
  )
}

export function useBoards() {
  const context = useContext(BoardContext)
  if (context === undefined) {
    throw new Error("useBoards must be used within a BoardProvider")
  }
  return context
}
