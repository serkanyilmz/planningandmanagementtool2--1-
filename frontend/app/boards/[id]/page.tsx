"use client"

import { use, useState, useMemo, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { BoardAiPanel } from "@/components/ai/board-ai-panel"
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material"
import { PersonAdd, Label as LabelIcon, Settings as SettingsIcon, Group as GroupIcon } from "@mui/icons-material"
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
    reorderLists,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addTaskAttachment,
    setTaskAttachmentCover,
    deleteTaskAttachment,
    addMemberToBoard,
    updateBoardMemberRole,
    removeMemberFromBoard,
    refreshBoards,
    isLoading,
  } = useBoards()
  const { users, getUserByEmail, currentUser } = useAuth()
  const { filters, setPendingSelectedLabelIds, applyFilters } = useFilters()
  const { addNotification } = useNotifications()

  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [memberEmail, setMemberEmail] = useState("")
  const [memberError, setMemberError] = useState("")
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false)
  const [editBoardDialogOpen, setEditBoardDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [missingBoardRefreshId, setMissingBoardRefreshId] = useState<string | null>(null)

  const board = getBoard(id)
  const isAdmin = board?.currentUserRole === "admin"

  useEffect(() => {
    if (board || isLoading || missingBoardRefreshId === id) return
    setMissingBoardRefreshId(id)
    void refreshBoards()
  }, [board, id, isLoading, missingBoardRefreshId, refreshBoards])

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

  useEffect(() => {
    if (!board) return
    const boardLabelIds = new Set(board.labels.map((label) => label.id))
    const validSelectedIds = filters.selectedLabelIds.filter((labelId) => boardLabelIds.has(labelId))
    if (validSelectedIds.length !== filters.selectedLabelIds.length) {
      setPendingSelectedLabelIds(validSelectedIds)
      applyFilters()
    }
  }, [board, filters.selectedLabelIds, setPendingSelectedLabelIds, applyFilters])

  const getBoardMembers = (): Assignee[] => {
    if (!board) return []
    if (board.members?.length) {
      return board.members.map((member) => ({ id: member.id, name: member.name, avatar: member.avatar }))
    }
    return board.memberIds
      .map((memberId) => users.find((u) => u.id === memberId))
      .filter((user): user is NonNullable<typeof user> => Boolean(user))
      .map((user) => ({ id: user.id, name: user.name, avatar: user.profileImageUrl || "" }))
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

  const handleAddMember = async () => {
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
    await addMemberToBoard(id, user.id)
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
              {isLoading || missingBoardRefreshId === id ? "Loading board..." : "Board not found"}
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
                {board.boardKey && (
                  <Typography variant="caption" sx={{ color: "text.secondary", border: "1px solid", borderColor: "divider", px: 1, py: 0.25, borderRadius: 1 }}>
                    {board.boardKey}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {board.description}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {isAdmin && (
                <>
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
                  <Tooltip title="Members">
                    <IconButton onClick={() => setMembersDialogOpen(true)}>
                      <GroupIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Member">
                    <IconButton onClick={() => setAddMemberDialogOpen(true)}>
                      <PersonAdd />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>

          <BoardAiPanel
            boardId={id}
            lists={board.data.lists}
            boardLabels={board.labels}
            onAddTask={(listId, task) => addTask(id, listId, task)}
          />

          {/* Kanban Board - Pass board-specific labels */}
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <KanbanBoard
              boardId={id}
              boardKey={board.boardKey}
              boardTitle={board.title}
              boardData={filteredBoardData || board.data}
              boardMembers={getBoardMembers()}
              boardLabels={board.labels}
              onAddList={(title) => addList(id, title)}
              onRenameList={(listId, newTitle) => renameList(id, listId, newTitle)}
              onDeleteList={(listId) => deleteList(id, listId)}
              onClearListTasks={(listId) => clearListTasks(id, listId)}
              onReorderLists={(listIds) => reorderLists(id, listIds)}
              onAddTask={(listId, task) => addTask(id, listId, task)}
              onUpdateTask={(listId, taskId, updates) => updateTask(id, listId, taskId, updates)}
              onDeleteTask={(listId, taskId) => deleteTask(id, listId, taskId)}
              onMoveTask={(fromListId, toListId, taskId) => moveTask(id, fromListId, toListId, taskId)}
              onAddTaskAttachment={(taskId, file) => addTaskAttachment(id, taskId, file)}
              onSetTaskAttachmentCover={(taskId, attachmentId) => setTaskAttachmentCover(id, taskId, attachmentId)}
              onDeleteTaskAttachment={(taskId, attachmentId) => deleteTaskAttachment(id, taskId, attachmentId)}
              canManageLists={isAdmin}
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

      <Dialog open={membersDialogOpen} onClose={() => setMembersDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Board Members</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
            {(board.members || []).map((member) => (
              <Box
                key={member.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1.5,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {member.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {member.email}
                  </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    label="Role"
                    value={member.role}
                    onChange={(event) => updateBoardMemberRole(id, member.id, event.target.value as "admin" | "member")}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="member">Member</MenuItem>
                  </Select>
                </FormControl>
                <Button color="error" onClick={() => removeMemberFromBoard(id, member.id)}>
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

            <EditBoardDialog
        open={editBoardDialogOpen}
        onClose={() => setEditBoardDialogOpen(false)}
        board={{ id: board.id, title: board.title, color: board.color }}
        onSave={handleSaveBoard}
      />
    </Box>
  )
}
