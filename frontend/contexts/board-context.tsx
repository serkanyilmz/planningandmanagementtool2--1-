"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { BoardData, Task, List, Label } from "@/types/kanban"

export interface Board {
  id: string
  title: string
  description: string
  color: string
  memberIds: string[]
  data: BoardData
  labels: Label[]
}

interface BoardContextType {
  boards: Board[]
  createBoard: (title: string, color: string, creatorId: string) => Board
  getBoard: (id: string) => Board | undefined
  updateBoard: (id: string, updates: Partial<Board>) => void
  deleteBoard: (id: string) => void
  addMemberToBoard: (boardId: string, userId: string) => void
  removeMemberFromBoard: (boardId: string, userId: string) => void
  getBoardsForUser: (userId: string) => Board[]
  // List operations
  addList: (boardId: string, title: string) => void
  renameList: (boardId: string, listId: string, newTitle: string) => void
  deleteList: (boardId: string, listId: string) => void
  clearListTasks: (boardId: string, listId: string) => void
  // Task operations
  addTask: (boardId: string, listId: string, task: Omit<Task, "id">) => void
  updateTask: (boardId: string, listId: string, taskId: string, updates: Partial<Task>) => void
  deleteTask: (boardId: string, listId: string, taskId: string) => void
  moveTask: (boardId: string, fromListId: string, toListId: string, taskId: string) => void
  addLabelToBoard: (boardId: string, name: string, color: string) => Label
  updateBoardLabel: (boardId: string, labelId: string, updates: Partial<Label>) => void
  deleteBoardLabel: (boardId: string, labelId: string) => void
}

const BoardContext = createContext<BoardContextType | undefined>(undefined)

const BOARDS_STORAGE_KEY = "planify_boards"

const defaultBoardLabels: Label[] = [
  { id: "label-devops", name: "DevOps", color: "#64748b" },
  { id: "label-frontend", name: "Frontend", color: "#8b5cf6" },
  { id: "label-backend", name: "Backend", color: "#06b6d4" },
  { id: "label-design", name: "Design", color: "#f59e0b" },
  { id: "label-bug", name: "Bug", color: "#ef4444" },
]

// Initial sample data with board-specific labels
const initialBoards: Board[] = [
  {
    id: "1",
    title: "Product Launch",
    description: "Q1 2025 Product Roadmap",
    color: "#002366",
    memberIds: [],
    labels: [
      { id: "l1", name: "Research", color: "#6366f1" },
      { id: "l2", name: "Docs", color: "#10b981" },
      { id: "l3", name: "Design", color: "#f59e0b" },
      { id: "l4", name: "UX", color: "#ec4899" },
      { id: "l7", name: "Frontend", color: "#8b5cf6" },
      { id: "l8", name: "Charts", color: "#06b6d4" },
      { id: "l9", name: "DevOps", color: "#64748b" },
    ],
    data: {
      lists: [
        {
          id: "1",
          title: "Backlog",
          tasks: [
            {
              id: "t1",
              title: "Research competitor pricing models",
              description: "Analyze pricing strategies of top 5 competitors",
              labels: [{ id: "l1", name: "Research", color: "#6366f1" }],
              priority: "low",
              dueDate: "2025-01-15",
              assignees: [{ id: "a1", name: "Sarah Chen", avatar: "/professional-woman.png" }],
            },
            {
              id: "t2",
              title: "Update user documentation for v2.0",
              description: "Complete documentation update for new features",
              labels: [{ id: "l2", name: "Docs", color: "#10b981" }],
              priority: "medium",
              dueDate: "2025-01-20",
              assignees: [{ id: "a2", name: "Mike Ross", avatar: "/professional-man.png" }],
            },
          ],
        },
        {
          id: "2",
          title: "To Do",
          tasks: [
            {
              id: "t3",
              title: "Design new onboarding flow",
              description: "Create wireframes and mockups for the new user onboarding experience",
              labels: [
                { id: "l3", name: "Design", color: "#f59e0b" },
                { id: "l4", name: "UX", color: "#ec4899" },
              ],
              priority: "high",
              dueDate: "2025-01-08",
              assignees: [
                { id: "a3", name: "Emma Wilson", avatar: "/woman-designer.png" },
                { id: "a1", name: "Sarah Chen", avatar: "/professional-woman.png" },
              ],
            },
          ],
        },
        {
          id: "3",
          title: "In Progress",
          tasks: [
            {
              id: "t6",
              title: "Build dashboard analytics widgets",
              description: "Implement chart components for the analytics dashboard",
              labels: [
                { id: "l7", name: "Frontend", color: "#8b5cf6" },
                { id: "l8", name: "Charts", color: "#06b6d4" },
              ],
              priority: "high",
              dueDate: "2025-01-05",
              assignees: [
                { id: "a1", name: "Sarah Chen", avatar: "/professional-woman.png" },
                { id: "a3", name: "Emma Wilson", avatar: "/woman-designer.png" },
              ],
            },
          ],
        },
        {
          id: "4",
          title: "Done",
          tasks: [
            {
              id: "t9",
              title: "Set up CI/CD pipeline",
              description: "Configure GitHub Actions for automated testing and deployment",
              labels: [{ id: "l9", name: "DevOps", color: "#64748b" }],
              priority: "medium",
              dueDate: "2024-12-28",
              assignees: [{ id: "a4", name: "James Liu", avatar: "/man-developer.png" }],
            },
          ],
        },
      ],
    },
  },
  {
    id: "2",
    title: "Marketing Campaign",
    description: "Q1 2025 Marketing Initiative",
    color: "#10b981",
    memberIds: [],
    labels: [...defaultBoardLabels],
    data: {
      lists: [
        { id: "1", title: "Ideas", tasks: [] },
        { id: "2", title: "Planning", tasks: [] },
        { id: "3", title: "In Progress", tasks: [] },
        { id: "4", title: "Complete", tasks: [] },
      ],
    },
  },
  {
    id: "3",
    title: "Development Sprint",
    description: "Sprint 12 - Feature Development",
    color: "#f59e0b",
    memberIds: [],
    labels: [...defaultBoardLabels],
    data: {
      lists: [
        { id: "1", title: "Backlog", tasks: [] },
        { id: "2", title: "To Do", tasks: [] },
        { id: "3", title: "In Progress", tasks: [] },
        { id: "4", title: "Review", tasks: [] },
        { id: "5", title: "Done", tasks: [] },
      ],
    },
  },
  {
    id: "4",
    title: "Customer Support",
    description: "Support ticket management",
    color: "#8b5cf6",
    memberIds: [],
    labels: [...defaultBoardLabels],
    data: {
      lists: [
        { id: "1", title: "New", tasks: [] },
        { id: "2", title: "In Progress", tasks: [] },
        { id: "3", title: "Resolved", tasks: [] },
      ],
    },
  },
]

export function BoardProvider({ children }: { children: ReactNode }) {
  const [boards, setBoards] = useState<Board[]>(initialBoards)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedBoards = localStorage.getItem(BOARDS_STORAGE_KEY)
    if (storedBoards) {
      setBoards(JSON.parse(storedBoards))
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(boards))
    }
  }, [boards, isHydrated])

  const createBoard = useCallback((title: string, color: string, creatorId: string): Board => {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title,
      description: "New board description",
      color,
      memberIds: [creatorId],
      labels: [...defaultBoardLabels], // Each new board gets default labels
      data: {
        lists: [
          { id: `list-${Date.now()}-1`, title: "To Do", tasks: [] },
          { id: `list-${Date.now()}-2`, title: "In Progress", tasks: [] },
          { id: `list-${Date.now()}-3`, title: "Done", tasks: [] },
        ],
      },
    }
    setBoards((prev) => [...prev, newBoard])
    return newBoard
  }, [])

  const getBoard = useCallback(
    (id: string) => {
      return boards.find((b) => b.id === id)
    },
    [boards],
  )

  const updateBoard = useCallback((id: string, updates: Partial<Board>) => {
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }, [])

  const deleteBoard = useCallback((id: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const addMemberToBoard = useCallback((boardId: string, userId: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId && !board.memberIds.includes(userId)) {
          return { ...board, memberIds: [...board.memberIds, userId] }
        }
        return board
      }),
    )
  }, [])

  const removeMemberFromBoard = useCallback((boardId: string, userId: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          return { ...board, memberIds: board.memberIds.filter((id) => id !== userId) }
        }
        return board
      }),
    )
  }, [])

  const getBoardsForUser = useCallback(
    (userId: string) => {
      return boards.filter((board) => board.memberIds.includes(userId) || board.memberIds.length === 0)
    },
    [boards],
  )

  // List operations
  const addList = useCallback((boardId: string, title: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          const newList: List = {
            id: `list-${Date.now()}`,
            title,
            tasks: [],
          }
          return {
            ...board,
            data: {
              ...board.data,
              lists: [...board.data.lists, newList],
            },
          }
        }
        return board
      }),
    )
  }, [])

  const renameList = useCallback((boardId: string, listId: string, newTitle: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          return {
            ...board,
            data: {
              ...board.data,
              lists: board.data.lists.map((list) => (list.id === listId ? { ...list, title: newTitle } : list)),
            },
          }
        }
        return board
      }),
    )
  }, [])

  const deleteList = useCallback((boardId: string, listId: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          return {
            ...board,
            data: {
              ...board.data,
              lists: board.data.lists.filter((list) => list.id !== listId),
            },
          }
        }
        return board
      }),
    )
  }, [])

  const clearListTasks = useCallback((boardId: string, listId: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          return {
            ...board,
            data: {
              ...board.data,
              lists: board.data.lists.map((list) => (list.id === listId ? { ...list, tasks: [] } : list)),
            },
          }
        }
        return board
      }),
    )
  }, [])

  // Task operations
  const addTask = useCallback((boardId: string, listId: string, task: Omit<Task, "id">) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          return {
            ...board,
            data: {
              ...board.data,
              lists: board.data.lists.map((list) => {
                if (list.id === listId) {
                  return {
                    ...list,
                    tasks: [...list.tasks, { ...task, id: `task-${Date.now()}` }],
                  }
                }
                return list
              }),
            },
          }
        }
        return board
      }),
    )
  }, [])

  const updateTask = useCallback((boardId: string, listId: string, taskId: string, updates: Partial<Task>) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          return {
            ...board,
            data: {
              ...board.data,
              lists: board.data.lists.map((list) => {
                if (list.id === listId) {
                  return {
                    ...list,
                    tasks: list.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
                  }
                }
                return list
              }),
            },
          }
        }
        return board
      }),
    )
  }, [])

  const deleteTask = useCallback((boardId: string, listId: string, taskId: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          return {
            ...board,
            data: {
              ...board.data,
              lists: board.data.lists.map((list) => {
                if (list.id === listId) {
                  return {
                    ...list,
                    tasks: list.tasks.filter((task) => task.id !== taskId),
                  }
                }
                return list
              }),
            },
          }
        }
        return board
      }),
    )
  }, [])

  const moveTask = useCallback((boardId: string, fromListId: string, toListId: string, taskId: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          const fromList = board.data.lists.find((l) => l.id === fromListId)
          const task = fromList?.tasks.find((t) => t.id === taskId)

          if (!task) return board

          return {
            ...board,
            data: {
              ...board.data,
              lists: board.data.lists.map((list) => {
                if (list.id === fromListId) {
                  return { ...list, tasks: list.tasks.filter((t) => t.id !== taskId) }
                }
                if (list.id === toListId) {
                  return { ...list, tasks: [...list.tasks, task] }
                }
                return list
              }),
            },
          }
        }
        return board
      }),
    )
  }, [])

  const addLabelToBoard = useCallback((boardId: string, name: string, color: string): Label => {
    const newLabel: Label = {
      id: `label-${Date.now()}`,
      name,
      color,
    }
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          return { ...board, labels: [...board.labels, newLabel] }
        }
        return board
      }),
    )
    return newLabel
  }, [])

  const updateBoardLabel = useCallback((boardId: string, labelId: string, updates: Partial<Label>) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          return {
            ...board,
            labels: board.labels.map((label) => (label.id === labelId ? { ...label, ...updates } : label)),
          }
        }
        return board
      }),
    )
  }, [])

  const deleteBoardLabel = useCallback((boardId: string, labelId: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id === boardId) {
          return {
            ...board,
            labels: board.labels.filter((label) => label.id !== labelId),
          }
        }
        return board
      }),
    )
  }, [])

  return (
    <BoardContext.Provider
      value={{
        boards,
        createBoard,
        getBoard,
        updateBoard,
        deleteBoard,
        addMemberToBoard,
        removeMemberFromBoard,
        getBoardsForUser,
        addList,
        renameList,
        deleteList,
        clearListTasks,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
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
