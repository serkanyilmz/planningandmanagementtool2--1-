"use client"

import type React from "react"
import { useState } from "react"
import {
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Autocomplete,
} from "@mui/material"
import { MoreHoriz, Add as AddIcon } from "@mui/icons-material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { TaskCard } from "./task-card"
import type { List, Task, Label, Assignee } from "@/types/kanban"
import { useNotifications } from "@/contexts/notification-context"
import { useAuth } from "@/contexts/auth-context"

interface ColumnProps {
  list: List
  boardId: string
  boardMembers: Assignee[]
  boardLabels: Label[]
  onRename: (newTitle: string) => void
  onDelete: () => void
  onClearTasks: () => void
  onAddTask: (task: Omit<Task, "id">) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, listId: string) => void
  onTaskDragStart: (e: React.DragEvent, taskId: string, fromListId: string) => void
}

const REMINDER_OPTIONS = [
  { value: "none", label: "No reminder" },
  { value: "1_day", label: "1 day before" },
  { value: "2_hours", label: "2 hours before" },
  { value: "1_hour", label: "1 hour before" },
]

export function Column({
  list,
  boardId,
  boardMembers,
  boardLabels,
  onRename,
  onDelete,
  onClearTasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onDragOver,
  onDrop,
  onTaskDragStart,
}: ColumnProps) {
  const { addNotification } = useNotifications()
  const { currentUser } = useAuth()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(list.title)
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(new Date())
  const [newTaskLabels, setNewTaskLabels] = useState<Label[]>([])
  const [newTaskAssignee, setNewTaskAssignee] = useState<Assignee | null>(null)
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium")
  const [newTaskReminder, setNewTaskReminder] = useState<"1_day" | "2_hours" | "1_hour" | "none">("none")

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false)
  const [editedTaskTitle, setEditedTaskTitle] = useState("")
  const [editedTaskDescription, setEditedTaskDescription] = useState("")
  const [editedTaskDueDate, setEditedTaskDueDate] = useState<Date | null>(null)
  const [editedTaskLabels, setEditedTaskLabels] = useState<Label[]>([])
  const [editedTaskAssignee, setEditedTaskAssignee] = useState<Assignee | null>(null)
  const [editedTaskPriority, setEditedTaskPriority] = useState<"high" | "medium" | "low">("medium")
  const [editedTaskReminder, setEditedTaskReminder] = useState<"1_day" | "2_hours" | "1_hour" | "none">("none")

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleRename = () => {
    handleMenuClose()
    setRenameValue(list.title)
    setRenameDialogOpen(true)
  }

  const handleConfirmRename = () => {
    if (renameValue.trim()) {
      onRename(renameValue.trim())
      setRenameDialogOpen(false)
    }
  }

  const handleClearTasks = () => {
    onClearTasks()
    handleMenuClose()
  }

  const handleDelete = () => {
    onDelete()
    handleMenuClose()
  }

  const handleAddTask = () => {
    setAddTaskDialogOpen(true)
  }

  const handleConfirmAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        labels: newTaskLabels,
        priority: newTaskPriority,
        dueDate: newTaskDueDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        assignees: newTaskAssignee ? [newTaskAssignee] : [],
        reminderBefore: newTaskReminder,
      })

      if (newTaskAssignee && currentUser && newTaskAssignee.id !== currentUser.id) {
        addNotification({
          type: "assignment",
          title: "New Task Assignment",
          message: `${currentUser.name} assigned you to "${newTaskTitle.trim()}"`,
          userId: newTaskAssignee.id,
          boardId,
        })
      }

      // Reset form
      setNewTaskTitle("")
      setNewTaskDescription("")
      setNewTaskDueDate(new Date())
      setNewTaskLabels([])
      setNewTaskAssignee(null)
      setNewTaskPriority("medium")
      setNewTaskReminder("none")
      setAddTaskDialogOpen(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setEditedTaskTitle(task.title)
    setEditedTaskDescription(task.description || "")
    setEditedTaskDueDate(new Date(task.dueDate))
    setEditedTaskLabels(task.labels)
    setEditedTaskAssignee(task.assignees[0] || null)
    setEditedTaskPriority(task.priority)
    setEditedTaskReminder(task.reminderBefore || "none")
    setTaskDetailsOpen(true)
  }

  const handleSaveTaskDetails = () => {
    if (selectedTask && editedTaskTitle.trim()) {
      const previousAssignee = selectedTask.assignees[0]

      onUpdateTask(selectedTask.id, {
        title: editedTaskTitle.trim(),
        description: editedTaskDescription.trim(),
        labels: editedTaskLabels,
        priority: editedTaskPriority,
        dueDate: editedTaskDueDate?.toISOString().split("T")[0] || selectedTask.dueDate,
        assignees: editedTaskAssignee ? [editedTaskAssignee] : [],
        reminderBefore: editedTaskReminder,
      })

      if (
        editedTaskAssignee &&
        currentUser &&
        editedTaskAssignee.id !== currentUser.id &&
        editedTaskAssignee.id !== previousAssignee?.id
      ) {
        addNotification({
          type: "assignment",
          title: "Task Assigned to You",
          message: `${currentUser.name} assigned you to "${editedTaskTitle.trim()}"`,
          userId: editedTaskAssignee.id,
          boardId,
        })
      }

      setTaskDetailsOpen(false)
      setSelectedTask(null)
    }
  }

  const handleDeleteTask = () => {
    if (selectedTask) {
      onDeleteTask(selectedTask.id)
      setTaskDetailsOpen(false)
      setSelectedTask(null)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, list.id)}
        sx={{
          width: 288,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: "rgba(0,0,0,0.02)",
          borderRadius: 2,
        }}
      >
        {/* Column Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {list.title}
            </Typography>
            <Chip label={list.tasks.length} size="small" sx={{ height: 20, minWidth: 20, fontSize: 12 }} />
          </Box>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreHoriz fontSize="small" />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleRename}>Rename</MenuItem>
            <MenuItem onClick={handleClearTasks}>Clear all tasks</MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
              Delete
            </MenuItem>
          </Menu>
        </Box>

        {/* Task List */}
        <Box sx={{ flex: 1, overflow: "auto", px: 1, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {list.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => handleTaskClick(task)}
                onDragStart={(e) => onTaskDragStart(e, task.id, list.id)}
              />
            ))}
          </Box>
        </Box>

        {/* Column Footer */}
        <Box sx={{ p: 1 }}>
          <Button
            startIcon={<AddIcon />}
            fullWidth
            sx={{ justifyContent: "flex-start", color: "text.secondary" }}
            onClick={handleAddTask}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="List Name"
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirmRename()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmRename} disabled={!renameValue.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={addTaskDialogOpen} onClose={() => setAddTaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <DatePicker
            label="Due Date"
            value={newTaskDueDate}
            onChange={(date) => setNewTaskDueDate(date)}
            sx={{ width: "100%", mb: 2 }}
          />
          <Autocomplete
            multiple
            options={boardLabels}
            getOptionLabel={(option) => option.name}
            value={newTaskLabels}
            onChange={(_, newValue) => setNewTaskLabels(newValue)}
            renderInput={(params) => <TextField {...params} label="Labels" />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  size="small"
                  sx={{ bgcolor: option.color, color: "white" }}
                />
              ))
            }
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Assign To</InputLabel>
            <Select
              value={newTaskAssignee?.id || ""}
              onChange={(e) => {
                const member = boardMembers.find((m) => m.id === e.target.value)
                setNewTaskAssignee(member || null)
              }}
              input={<OutlinedInput label="Assign To" />}
            >
              <MenuItem value="">None</MenuItem>
              {boardMembers.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as "high" | "medium" | "low")}
              input={<OutlinedInput label="Priority" />}
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Remind Me</InputLabel>
            <Select
              value={newTaskReminder}
              onChange={(e) => setNewTaskReminder(e.target.value as typeof newTaskReminder)}
              input={<OutlinedInput label="Remind Me" />}
            >
              {REMINDER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTaskDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmAddTask} disabled={!newTaskTitle.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={taskDetailsOpen} onClose={() => setTaskDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Title"
            fullWidth
            value={editedTaskTitle}
            onChange={(e) => setEditedTaskTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editedTaskDescription}
            onChange={(e) => setEditedTaskDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <DatePicker
            label="Due Date"
            value={editedTaskDueDate}
            onChange={(date) => setEditedTaskDueDate(date)}
            sx={{ width: "100%", mb: 2 }}
          />
          <Autocomplete
            multiple
            options={boardLabels}
            getOptionLabel={(option) => option.name}
            value={editedTaskLabels}
            onChange={(_, newValue) => setEditedTaskLabels(newValue)}
            renderInput={(params) => <TextField {...params} label="Labels" />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  size="small"
                  sx={{ bgcolor: option.color, color: "white" }}
                />
              ))
            }
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Assign To</InputLabel>
            <Select
              value={editedTaskAssignee?.id || ""}
              onChange={(e) => {
                const member = boardMembers.find((m) => m.id === e.target.value)
                setEditedTaskAssignee(member || null)
              }}
              input={<OutlinedInput label="Assign To" />}
            >
              <MenuItem value="">None</MenuItem>
              {boardMembers.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={editedTaskPriority}
              onChange={(e) => setEditedTaskPriority(e.target.value as "high" | "medium" | "low")}
              input={<OutlinedInput label="Priority" />}
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Remind Me</InputLabel>
            <Select
              value={editedTaskReminder}
              onChange={(e) => setEditedTaskReminder(e.target.value as typeof editedTaskReminder)}
              input={<OutlinedInput label="Remind Me" />}
            >
              {REMINDER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteTask} color="error">
            Delete
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setTaskDetailsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTaskDetails} disabled={!editedTaskTitle.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}
