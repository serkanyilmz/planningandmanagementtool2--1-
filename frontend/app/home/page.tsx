"use client"

import { Box, Typography, Grid } from "@mui/material"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { BoardCard } from "@/components/dashboard/board-card"
import { TaskListView } from "@/components/task-list-view"
import { useAuth } from "@/contexts/auth-context"
import { useBoards } from "@/contexts/board-context"
import { useFilters } from "@/contexts/filter-context"
import { useMemo } from "react"
import type { Task } from "@/types/kanban"

interface TaskWithBoard extends Task {
  boardId: string
  boardTitle: string
  boardColor: string
  listTitle: string
}

export default function HomePage() {
  const { currentUser } = useAuth()
  const { boards, getBoardsForUser } = useBoards()
  const { filters, hasActiveFilters } = useFilters()

  const userBoards = currentUser ? getBoardsForUser(currentUser.id) : []

  const showTaskView = filters.myTasksOnly || filters.dueDateSort !== "none" || filters.keyword.trim() !== ""

  const allTasksWithBoard = useMemo((): TaskWithBoard[] => {
    const tasks: TaskWithBoard[] = []
    userBoards.forEach((board) => {
      board.data.lists.forEach((list) => {
        list.tasks.forEach((task) => {
          tasks.push({
            ...task,
            boardId: board.id,
            boardTitle: board.title,
            boardColor: board.color,
            listTitle: list.title,
          })
        })
      })
    })
    return tasks
  }, [userBoards])

  const filteredTasks = useMemo(() => {
    let result = [...allTasksWithBoard]

    // Keyword search on task titles
    if (filters.keyword.trim()) {
      const query = filters.keyword.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.boardTitle.toLowerCase().includes(query),
      )
    }

    // My Tasks Only filter
    if (filters.myTasksOnly && currentUser) {
      result = result.filter((task) => task.assignees.some((assignee) => assignee.id === currentUser.id))
    }

    // Label filter
    if (filters.selectedLabelIds.length > 0) {
      result = result.filter((task) => task.labels.some((label) => filters.selectedLabelIds.includes(label.id)))
    }

    // Due date sort
    if (filters.dueDateSort !== "none") {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime()
        const dateB = new Date(b.dueDate).getTime()
        return filters.dueDateSort === "closest" ? dateA - dateB : dateB - dateA
      })
    }

    return result
  }, [allTasksWithBoard, filters, currentUser])

  // Filter boards (for board view)
  const filteredBoards = useMemo(() => {
    let result = userBoards

    // Keyword search on board titles
    if (filters.keyword.trim()) {
      const query = filters.keyword.toLowerCase()
      result = result.filter(
        (board) =>
          board.title.toLowerCase().includes(query) ||
          board.description.toLowerCase().includes(query) ||
          board.data.lists.some((list) => list.tasks.some((task) => task.title.toLowerCase().includes(query))),
      )
    }

    // Label filter
    if (filters.selectedLabelIds.length > 0) {
      result = result.filter((board) =>
        board.data.lists.some((list) =>
          list.tasks.some((task) => task.labels.some((label) => filters.selectedLabelIds.includes(label.id))),
        ),
      )
    }

    return result
  }, [userBoards, filters])

  const getBoardStats = (board: (typeof boards)[0]) => {
    const listCount = board.data.lists.length
    const taskCount = board.data.lists.reduce((count, list) => count + list.tasks.length, 0)
    return { listCount, taskCount }
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />

        <Box component="main" sx={{ flex: 1, overflow: "auto", bgcolor: "background.default", p: { xs: 2, lg: 4 } }}>
          <Box sx={{ textAlign: "center", py: 4, mb: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Welcome back, {currentUser?.name?.split(" ")[0] || "User"}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ready to manage your projects?
            </Typography>
          </Box>

          {showTaskView ? (
            // Task View - Show aggregated tasks
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Filtered Tasks ({filteredTasks.length} results)
              </Typography>
              <TaskListView tasks={filteredTasks} />
            </Box>
          ) : (
            // Board View - Show boards grid
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Your Boards {hasActiveFilters && `(${filteredBoards.length} results)`}
              </Typography>
              <Grid container spacing={3}>
                {filteredBoards.map((board) => {
                  const { listCount, taskCount } = getBoardStats(board)
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={board.id}>
                      <BoardCard
                        id={board.id}
                        title={board.title}
                        color={board.color}
                        listCount={listCount}
                        taskCount={taskCount}
                        membersCount={board.memberIds.length || 3}
                      />
                    </Grid>
                  )
                })}
              </Grid>
              {filteredBoards.length === 0 && (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    No boards match your filters.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
