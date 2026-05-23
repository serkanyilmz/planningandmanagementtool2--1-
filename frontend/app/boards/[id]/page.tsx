"use client"

import { use, useState, useMemo, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { BoardLabelsManager } from "@/components/kanban/board-labels-manager"
import { EditBoardDialog } from "@/components/edit-board-dialog"
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tooltip,
} from "@mui/material"
import { PersonAdd, Label as LabelIcon, Settings as SettingsIcon } from "@mui/icons-material"
import { useBoards } from "@/contexts/board-context"
import { useAuth } from "@/contexts/auth-context"
import { useFilters } from "@/contexts/filter-context"
import { useNotifications } from "@/contexts/notification-context"
import type { Assignee, BoardData } from "@/types/kanban"

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const {
    getBoard,
    updateBoard,
    addList,
    renameList,
    deleteList,
    clearListTasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addMemberToBoard,
    boards,
  } = useBoards()
  const { users, getUserByEmail, currentUser } = useAuth()
  const { filters } = useFilters()
  const { addNotification } = useNotifications()

  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [memberEmail, setMemberEmail] = useState("")
  const [memberError, setMemberError] = useState("")
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false)
  const [editBoardDialogOpen, setEditBoardDialogOpen] = useState(false)

  const board = getBoard(id)

  useEffect(() => {
    if (!board || !currentUser) return

    const checkReminders = () => {
      const now = new Date()
      board.data.lists.forEach((list) => {
        list.tasks.forEach((task) => {
          if (!task.reminderBefore || task.reminderBefore === "none") return

          const dueDate = new Date(task.dueDate)
          let reminderMs = 0

          switch (task.reminderBefore) {
            case "1_day":
              reminderMs = 24 * 60 * 60 * 1000
              break
            case "2_hours":
              reminderMs = 2 * 60 * 60 * 1000
              break
            case "1_hour":
              reminderMs = 1 * 60 * 60 * 1000
              break
          }

          const reminderTime = new Date(dueDate.getTime() - reminderMs)

          // Check if current user is assigned and reminder time has passed
          const isAssigned = task.assignees.some((a) => a.id === currentUser.id)
          if (isAssigned && now >= reminderTime && now < dueDate) {
            // Check if notification already exists (simple check)
            const notifKey = `reminder-${task.id}-${task.reminderBefore}`
            const existingNotif = localStorage.getItem(notifKey)
            if (!existingNotif) {
              addNotification({
                type: "due_reminder",
                title: "Task Due Soon",
                message: `"${task.title}" is due ${task.reminderBefore === "1_day" ? "tomorrow" : `in ${task.reminderBefore.replace("_", " ")}`}`,
                userId: currentUser.id,
                taskId: task.id,
                boardId: id,
              })
              localStorage.setItem(notifKey, "sent")
            }
          }
        })
      })
    }

    checkReminders()
    const interval = setInterval(checkReminders, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [board, currentUser, id, addNotification])

  const getBoardMembers = (): Assignee[] => {
    if (!board) return []
    return board.memberIds
      .map((memberId) => {
        const user = users.find((u) => u.id === memberId)
        if (user) {
          return {
            id: user.id,
            name: user.name,
            avatar: "",
          }
        }
        return null
      })
      .filter((m): m is Assignee => m !== null)
  }

  const filteredBoardData = useMemo((): BoardData | null => {
    if (!board) return null

    const lists = board.data.lists.map((list) => {
      let tasks = [...list.tasks]

      // Keyword filter on task titles
      if (filters.keyword.trim()) {
        const query = filters.keyword.toLowerCase()
        tasks = tasks.filter((task) => task.title.toLowerCase().includes(query))
      }

      // My Tasks Only filter
      if (filters.myTasksOnly && currentUser) {
        tasks = tasks.filter((task) => task.assignees.some((assignee) => assignee.id === currentUser.id))
      }

      // Label filter
      if (filters.selectedLabelIds.length > 0) {
        tasks = tasks.filter((task) => task.labels.some((label) => filters.selectedLabelIds.includes(label.id)))
      }

      // Due date sort
      if (filters.dueDateSort !== "none") {
        tasks = [...tasks].sort((a, b) => {
          const dateA = new Date(a.dueDate).getTime()
          const dateB = new Date(b.dueDate).getTime()
          return filters.dueDateSort === "closest" ? dateA - dateB : dateB - dateA
        })
      }

      return { ...list, tasks }
    })

    return { lists }
  }, [board, filters, currentUser])

  const handleAddMember = () => {
    setMemberError("")
    const user = getUserByEmail(memberEmail.trim())
    if (!user) {
      setMemberError("No user found with this email")
      return
    }
    if (board?.memberIds.includes(user.id)) {
      setMemberError("User is already a member of this board")
      return
    }
    addMemberToBoard(id, user.id)
    setMemberEmail("")
    setAddMemberDialogOpen(false)
  }

  const handleSaveBoard = (boardId: string, title: string, color: string) => {
    updateBoard(boardId, { title, color })
  }

  if (!board) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Header />
          <Box
            component="main"
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "background.default",
            }}
          >
            <Typography variant="h5" color="text.secondary">
              Board not found
            </Typography>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />

        <Box
          component="main"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.default",
            p: { xs: 2, lg: 3 },
          }}
        >
          {/* Board Header */}
          <Box sx={{ mb: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: board.color }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {board.title}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {board.description}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Board Settings">
                <IconButton onClick={() => setEditBoardDialogOpen(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Manage Labels">
                <IconButton onClick={() => setLabelsDialogOpen(true)}>
                  <LabelIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add Member">
                <IconButton onClick={() => setAddMemberDialogOpen(true)}>
                  <PersonAdd />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Kanban Board - Pass board-specific labels */}
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <KanbanBoard
              boardId={id}
              boardData={filteredBoardData || board.data}
              boardMembers={getBoardMembers()}
              boardLabels={board.labels}
              onAddList={(title) => addList(id, title)}
              onRenameList={(listId, newTitle) => renameList(id, listId, newTitle)}
              onDeleteList={(listId) => deleteList(id, listId)}
              onClearListTasks={(listId) => clearListTasks(id, listId)}
              onAddTask={(listId, task) => addTask(id, listId, task)}
              onUpdateTask={(listId, taskId, updates) => updateTask(id, listId, taskId, updates)}
              onDeleteTask={(listId, taskId) => deleteTask(id, listId, taskId)}
              onMoveTask={(fromListId, toListId, taskId) => moveTask(id, fromListId, toListId, taskId)}
            />
          </Box>
        </Box>
      </Box>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onClose={() => setAddMemberDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
            error={!!memberError}
            helperText={memberError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember} disabled={!memberEmail.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <BoardLabelsManager
        open={labelsDialogOpen}
        onClose={() => setLabelsDialogOpen(false)}
        boardId={id}
        labels={board.labels}
      />

      <EditBoardDialog
        open={editBoardDialogOpen}
        onClose={() => setEditBoardDialogOpen(false)}
        board={{ id: board.id, title: board.title, color: board.color }}
        onSave={handleSaveBoard}
      />
    </Box>
  )
}
