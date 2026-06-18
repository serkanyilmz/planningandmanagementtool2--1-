import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { AuthError } from "@/api/client"
import {
  addTask as addTaskRequest,
  createBoard as createBoardRequest,
  deleteTask as deleteTaskRequest,
  getBoards,
  moveTask as moveTaskRequest,
  updateTask as updateTaskRequest,
} from "@/api/boards"
import { useAuth } from "@/providers/auth-provider"
import type { Board, BoardReminder, Task } from "@/types/kanban"

interface BoardsContextValue {
  boards: Board[]
  loading: boolean
  refreshing: boolean
  reminders: BoardReminder[]
  refreshBoards: () => Promise<void>
  createBoard: (payload: { title: string; description: string; color: string }) => Promise<Board | null>
  getBoardById: (boardId: string) => Board | undefined
  addTask: (listId: string, task: Omit<Task, "id">) => Promise<Board | null>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Board | null>
  deleteTask: (taskId: string) => Promise<Board | null>
  moveTask: (taskId: string, targetListId: string) => Promise<Board | null>
  dismissReminder: (id: string) => void
}

const BoardsContext = createContext<BoardsContextValue | undefined>(undefined)

function isDueSoon(dueDate: string) {
  if (!dueDate) return null
  const due = new Date(`${dueDate}T23:59:59`)
  const now = new Date()
  const diff = due.getTime() - now.getTime()
  if (diff < 0) return "overdue" as const
  if (diff <= 24 * 60 * 60 * 1000) return "soon" as const
  return null
}

export function BoardsProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [dismissedReminderIds, setDismissedReminderIds] = useState<string[]>([])

  const handleAuthAware = useCallback(
    async <T,>(work: () => Promise<T>) => {
      try {
        return await work()
      } catch (error) {
        if (error instanceof AuthError) {
          await logout()
          return null
        }
        throw error
      }
    },
    [logout],
  )

  const replaceBoard = useCallback((board: Board) => {
    setBoards((prev) => {
      const next = prev.filter((item) => item.id !== board.id)
      return [...next, board].sort((a, b) => a.title.localeCompare(b.title))
    })
  }, [])

  const refreshBoards = useCallback(async () => {
    if (!token) {
      setBoards([])
      return
    }

    setRefreshing(true)
    const nextBoards = await handleAuthAware(() => getBoards(token))
    if (nextBoards) {
      setBoards(nextBoards)
    }
    setRefreshing(false)
  }, [handleAuthAware, token])

  useEffect(() => {
    if (!token) {
      setBoards([])
      return
    }

    setLoading(true)
    void handleAuthAware(() => getBoards(token))
      .then((nextBoards) => {
        if (nextBoards) {
          setBoards(nextBoards)
        }
      })
      .finally(() => setLoading(false))
  }, [handleAuthAware, token])

  const createBoard = useCallback(
    async (payload: { title: string; description: string; color: string }) => {
      if (!token) return null
      const board = await handleAuthAware(() => createBoardRequest(token, payload))
      if (board) {
        replaceBoard(board)
      }
      return board
    },
    [handleAuthAware, replaceBoard, token],
  )

  const getBoardById = useCallback((boardId: string) => boards.find((board) => board.id === boardId), [boards])

  const addTask = useCallback(
    async (listId: string, task: Omit<Task, "id">) => {
      if (!token) return null
      const board = await handleAuthAware(() => addTaskRequest(token, listId, task))
      if (board) {
        replaceBoard(board)
      }
      return board
    },
    [handleAuthAware, replaceBoard, token],
  )

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      if (!token) return null
      const board = await handleAuthAware(() => updateTaskRequest(token, taskId, updates))
      if (board) {
        replaceBoard(board)
      }
      return board
    },
    [handleAuthAware, replaceBoard, token],
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!token) return null
      const board = await handleAuthAware(() => deleteTaskRequest(token, taskId))
      if (board) {
        replaceBoard(board)
      }
      return board
    },
    [handleAuthAware, replaceBoard, token],
  )

  const moveTask = useCallback(
    async (taskId: string, targetListId: string) => {
      if (!token) return null
      const board = await handleAuthAware(() => moveTaskRequest(token, taskId, targetListId))
      if (board) {
        replaceBoard(board)
      }
      return board
    },
    [handleAuthAware, replaceBoard, token],
  )

  const reminders = useMemo(() => {
    return boards
      .flatMap((board) =>
        board.data.lists.flatMap((list) =>
          list.tasks
            .map((task) => {
              const severity = isDueSoon(task.dueDate)
              if (!severity) return null
              return {
                id: `${board.id}:${task.id}:${severity}`,
                boardId: board.id,
                boardTitle: board.title,
                taskId: task.id,
                taskTitle: task.title,
                dueDate: task.dueDate,
                severity,
              } satisfies BoardReminder
            })
            .filter(Boolean) as BoardReminder[],
        ),
      )
      .filter((reminder) => !dismissedReminderIds.includes(reminder.id))
      .slice(0, 3)
  }, [boards, dismissedReminderIds])

  const dismissReminder = useCallback((id: string) => {
    setDismissedReminderIds((prev) => [...prev, id])
  }, [])

  const value = useMemo(
    () => ({
      boards,
      loading,
      refreshing,
      reminders,
      refreshBoards,
      createBoard,
      getBoardById,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      dismissReminder,
    }),
    [addTask, boards, createBoard, deleteTask, dismissReminder, getBoardById, loading, moveTask, refreshBoards, refreshing, reminders, updateTask],
  )

  return <BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>
}

export function useBoards() {
  const context = useContext(BoardsContext)
  if (!context) {
    throw new Error("useBoards must be used within a BoardsProvider")
  }
  return context
}
