"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
    Alert,
    CircularProgress,
    Stack,
} from "@mui/material"
import {
    MoreHoriz,
    Add as AddIcon,
    AutoFixHigh,
    DragIndicator,
    ChevronLeft,
    ChevronRight,
    Close,
} from "@mui/icons-material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { TaskCard } from "./task-card"
import type { List, Task, Label, Assignee } from "@/types/kanban"
import { useNotifications } from "@/contexts/notification-context"
import { useAuth } from "@/contexts/auth-context"
import { useProtectedImage } from "@/hooks/use-protected-image"
import { suggestTask, type TaskSuggestionResponse } from "@/lib/ai-client"

interface ColumnProps {
    list: List
    boardId: string
    boardKey?: string
    boardTitle?: string
    boardMembers: Assignee[]
    boardLabels: Label[]
    onRename: (newTitle: string) => void
    onDelete: () => void
    onClearTasks: () => void
    onListDragStart: (e: React.DragEvent) => void
    onListDrop: (e: React.DragEvent) => void
    onAddTask: (task: Omit<Task, "id">) => Promise<Task | null> | void
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void
    onDeleteTask: (taskId: string) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent, listId: string) => void
    onTaskDragStart: (e: React.DragEvent, taskId: string, fromListId: string) => void
    canManageLists?: boolean
    onAddTaskAttachment?: (taskId: string, file: File) => void
    onSetTaskAttachmentCover?: (taskId: string, attachmentId: string) => void
    onDeleteTaskAttachment?: (taskId: string, attachmentId: string) => void
}

const REMINDER_OPTIONS = [
    { value: "none", label: "No reminder" },
    { value: "1_day", label: "1 day before" },
    { value: "2_hours", label: "2 hours before" },
    { value: "1_hour", label: "1 hour before" },
]

function dueDateString(date: Date | null, fallback = new Date()) {
    return (date || fallback).toISOString().split("T")[0]
}

function labelsFromSuggestion(boardLabels: Label[], labelNames: string[]) {
    const normalizedNames = labelNames.map((name) => name.toLowerCase())
    return boardLabels.filter((label) => normalizedNames.includes(label.name.toLowerCase()))
}

function descriptionWithAiDetails(suggestion: TaskSuggestionResponse) {
    const sections = [suggestion.suggestedDescription || ""]

    if (suggestion.acceptanceCriteria.length > 0) {
        sections.push(`Acceptance criteria:\n${suggestion.acceptanceCriteria.map((item) => `- ${item}`).join("\n")}`)
    }

    if (suggestion.checklist.length > 0) {
        sections.push(`Checklist:\n${suggestion.checklist.map((item) => `- ${item}`).join("\n")}`)
    }

    if (suggestion.riskReason) {
        sections.push(`Risk note:\n${suggestion.riskReason}`)
    }

    return sections.filter(Boolean).join("\n\n")
}

function AttachmentThumbnail({ url, name, sx }: { url: string; name: string; sx?: object }) {
    const { token } = useAuth()
    const src = useProtectedImage(url, token)

    if (!src) {
        return <Box sx={{ width: 96, height: 72, borderRadius: 1, bgcolor: "action.hover", ...sx }} />
    }

    return (
        <Box
            component="img"
            src={src}
            alt={name}
            sx={{
                width: 96,
                height: 72,
                objectFit: "cover",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                ...sx,
            }}
        />
    )
}

function TaskSuggestionDetails({ suggestion }: { suggestion: TaskSuggestionResponse }) {
    return (
        <Stack spacing={1}>
            <Typography variant="body2">
                <strong>{suggestion.suggestedPriority.toUpperCase()}</strong> priority, {suggestion.deadlineRisk} deadline
                risk. {suggestion.suggestions[0]}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
                {suggestion.estimatedEffort && <Chip size="small" label={`Effort: ${suggestion.estimatedEffort}`} />}
                {suggestion.suggestedReminder && <Chip size="small" label={`Reminder: ${suggestion.suggestedReminder}`} />}
            </Stack>
            {suggestion.acceptanceCriteria.length > 0 && (
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        Acceptance Criteria
                    </Typography>
                    <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.5 }}>
                        {suggestion.acceptanceCriteria.map((item) => (
                            <li key={item}>
                                <Typography variant="caption">{item}</Typography>
                            </li>
                        ))}
                    </Box>
                </Box>
            )}
            {suggestion.checklist.length > 0 && (
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        Checklist
                    </Typography>
                    <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.5 }}>
                        {suggestion.checklist.map((item) => (
                            <li key={item}>
                                <Typography variant="caption">{item}</Typography>
                            </li>
                        ))}
                    </Box>
                </Box>
            )}
        </Stack>
    )
}

export function Column({
                           list,
                           boardId,
                           boardKey,
                           boardTitle,
                           boardMembers,
                           boardLabels,
                           onRename,
                           onDelete,
                           onClearTasks,
                           onListDragStart,
                           onListDrop,
                           onAddTask,
                           onUpdateTask,
                           onDeleteTask,
                           onDragOver,
                           onDrop,
                           onTaskDragStart,
                           canManageLists = true,
                           onAddTaskAttachment,
                           onSetTaskAttachmentCover,
                           onDeleteTaskAttachment,
                       }: ColumnProps) {
    const { addNotification } = useNotifications()
    const { currentUser, token } = useAuth()

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
    const [newTaskImages, setNewTaskImages] = useState<File[]>([])
    const [newTaskSuggestion, setNewTaskSuggestion] = useState<TaskSuggestionResponse | null>(null)
    const [newTaskSuggestionLoading, setNewTaskSuggestionLoading] = useState(false)
    const [newTaskSuggestionError, setNewTaskSuggestionError] = useState("")

    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [taskDetailsOpen, setTaskDetailsOpen] = useState(false)
    const [editedTaskTitle, setEditedTaskTitle] = useState("")
    const [editedTaskDescription, setEditedTaskDescription] = useState("")
    const [editedTaskDueDate, setEditedTaskDueDate] = useState<Date | null>(null)
    const [editedTaskLabels, setEditedTaskLabels] = useState<Label[]>([])
    const [editedTaskAssignee, setEditedTaskAssignee] = useState<Assignee | null>(null)
    const [editedTaskPriority, setEditedTaskPriority] = useState<"high" | "medium" | "low">("medium")
    const [editedTaskReminder, setEditedTaskReminder] = useState<"1_day" | "2_hours" | "1_hour" | "none">("none")
    const [editedTaskSuggestion, setEditedTaskSuggestion] = useState<TaskSuggestionResponse | null>(null)
    const [editedTaskSuggestionLoading, setEditedTaskSuggestionLoading] = useState(false)
    const [editedTaskSuggestionError, setEditedTaskSuggestionError] = useState("")
    const [attachmentMenuAnchor, setAttachmentMenuAnchor] = useState<null | HTMLElement>(null)
    const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null)
    const [galleryOpen, setGalleryOpen] = useState(false)
    const [galleryIndex, setGalleryIndex] = useState(0)

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

    const requestNewTaskSuggestion = async () => {
        if (!token) {
            setNewTaskSuggestionError("Sign in to use AI suggestions.")
            return
        }

        setNewTaskSuggestionLoading(true)
        setNewTaskSuggestionError("")
        try {
            const suggestion = await suggestTask(token, {
                title: newTaskTitle,
                description: newTaskDescription,
                dueDate: dueDateString(newTaskDueDate),
                priority: newTaskPriority,
                boardId,
                boardKey,
                listId: list.id,
                boardTitle,
                listTitle: list.title,
                availableLabels: boardLabels.map((label) => label.name),
            })
            setNewTaskSuggestion(suggestion)
        } catch {
            setNewTaskSuggestionError("AI suggestion could not be loaded.")
        } finally {
            setNewTaskSuggestionLoading(false)
        }
    }

    const applyNewTaskSuggestion = () => {
        if (!newTaskSuggestion) return
        setNewTaskTitle(newTaskSuggestion.suggestedTitle || newTaskTitle)
        setNewTaskDescription(descriptionWithAiDetails(newTaskSuggestion))
        setNewTaskPriority(newTaskSuggestion.suggestedPriority)
        setNewTaskLabels(labelsFromSuggestion(boardLabels, newTaskSuggestion.suggestedLabels))
        setNewTaskReminder(newTaskSuggestion.suggestedReminder || newTaskReminder)
    }

    const requestEditedTaskSuggestion = async () => {
        if (!token) {
            setEditedTaskSuggestionError("Sign in to use AI suggestions.")
            return
        }

        setEditedTaskSuggestionLoading(true)
        setEditedTaskSuggestionError("")
        try {
            const suggestion = await suggestTask(token, {
                title: editedTaskTitle,
                description: editedTaskDescription,
                dueDate: dueDateString(editedTaskDueDate),
                priority: editedTaskPriority,
                boardId,
                boardKey,
                listId: list.id,
                boardTitle,
                listTitle: list.title,
                taskId: selectedTask?.id,
                taskKey: selectedTask?.taskKey,
                availableLabels: boardLabels.map((label) => label.name),
            })
            setEditedTaskSuggestion(suggestion)
        } catch {
            setEditedTaskSuggestionError("AI suggestion could not be loaded.")
        } finally {
            setEditedTaskSuggestionLoading(false)
        }
    }

    const applyEditedTaskSuggestion = () => {
        if (!editedTaskSuggestion) return
        setEditedTaskTitle(editedTaskSuggestion.suggestedTitle || editedTaskTitle)
        setEditedTaskDescription(descriptionWithAiDetails(editedTaskSuggestion))
        setEditedTaskPriority(editedTaskSuggestion.suggestedPriority)
        setEditedTaskLabels(labelsFromSuggestion(boardLabels, editedTaskSuggestion.suggestedLabels))
        setEditedTaskReminder(editedTaskSuggestion.suggestedReminder || editedTaskReminder)
    }

    const handleConfirmAddTask = async () => {
        if (newTaskTitle.trim()) {
            const createdTask = await onAddTask({
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim(),
                labels: newTaskLabels,
                priority: newTaskPriority,
                dueDate: dueDateString(newTaskDueDate),
                assignees: newTaskAssignee ? [newTaskAssignee] : [],
                reminderBefore: newTaskReminder,
            })

            if (createdTask) {
                for (const file of newTaskImages) {
                    await onAddTaskAttachment?.(createdTask.id, file)
                }
            }

            if (newTaskAssignee && currentUser && newTaskAssignee.id !== currentUser.id) {
                addNotification({
                    type: "assignment",
                    title: "New Task Assignment",
                    message: `${currentUser.name} assigned you to "${newTaskTitle.trim()}"`,
                    userId: newTaskAssignee.id,
                    boardId,
                })
            }

            setNewTaskTitle("")
            setNewTaskDescription("")
            setNewTaskDueDate(new Date())
            setNewTaskLabels([])
            setNewTaskAssignee(null)
            setNewTaskPriority("medium")
            setNewTaskReminder("none")
            setNewTaskImages([])
            setNewTaskSuggestion(null)
            setNewTaskSuggestionError("")
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
        setEditedTaskSuggestion(null)
        setEditedTaskSuggestionError("")
        setTaskDetailsOpen(true)
    }

    useEffect(() => {
        if (!selectedTask) return
        const freshTask = list.tasks.find((task) => task.id === selectedTask.id)
        if (freshTask) {
            setSelectedTask(freshTask)
        }
    }, [list.tasks, selectedTask])

    const handleAddAttachment = (file: File | undefined) => {
        if (!selectedTask || !file) return
        onAddTaskAttachment?.(selectedTask.id, file)
    }

    const handleDeleteAttachment = (attachmentId: string) => {
        if (!selectedTask) return
        onDeleteTaskAttachment?.(selectedTask.id, attachmentId)
    }

    const handleAttachmentMenuOpen = (event: React.MouseEvent<HTMLElement>, attachmentId: string) => {
        event.stopPropagation()
        setAttachmentMenuAnchor(event.currentTarget)
        setSelectedAttachmentId(attachmentId)
    }

    const handleAttachmentMenuClose = () => {
        setAttachmentMenuAnchor(null)
        setSelectedAttachmentId(null)
    }

    const handleSetCover = () => {
        if (selectedTask && selectedAttachmentId) {
            onSetTaskAttachmentCover?.(selectedTask.id, selectedAttachmentId)
        }
        handleAttachmentMenuClose()
    }

    const handleDeleteSelectedAttachment = () => {
        if (selectedTask && selectedAttachmentId) {
            handleDeleteAttachment(selectedAttachmentId)
        }
        handleAttachmentMenuClose()
    }

    const openGallery = (attachmentId: string) => {
        const index = (selectedTask?.attachments || []).findIndex((attachment) => attachment.id === attachmentId)
        setGalleryIndex(Math.max(0, index))
        setGalleryOpen(true)
    }

    const handleSaveTaskDetails = () => {
        if (selectedTask && editedTaskTitle.trim()) {
            const previousAssignee = selectedTask.assignees[0]

            onUpdateTask(selectedTask.id, {
                title: editedTaskTitle.trim(),
                description: editedTaskDescription.trim(),
                labels: editedTaskLabels,
                priority: editedTaskPriority,
                dueDate: dueDateString(editedTaskDueDate, new Date(selectedTask.dueDate)),
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

    const galleryAttachments = selectedTask?.attachments || []
    const galleryAttachment = galleryAttachments[galleryIndex]
    const selectedAttachment = galleryAttachments.find((attachment) => attachment.id === selectedAttachmentId)

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
                <Box
                    draggable={canManageLists}
                    onDragStart={onListDragStart}
                    onDragOver={onDragOver}
                    onDrop={onListDrop}
                    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 1.5 }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {canManageLists && <DragIndicator sx={{ fontSize: 16, color: "text.secondary", cursor: "grab" }} />}
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {list.title}
                        </Typography>
                        <Chip label={list.tasks.length} size="small" sx={{ height: 20, minWidth: 20, fontSize: 12 }} />
                    </Box>
                    {canManageLists && (
                        <>
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
                        </>
                    )}
                </Box>

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

                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={newTaskSuggestionLoading ? <CircularProgress size={16} /> : <AutoFixHigh />}
                            onClick={requestNewTaskSuggestion}
                            disabled={!newTaskTitle.trim() || newTaskSuggestionLoading}
                        >
                            AI Suggest
                        </Button>
                        {newTaskSuggestionError && <Alert severity="error">{newTaskSuggestionError}</Alert>}
                        {newTaskSuggestion && (
                            <Alert
                                severity={newTaskSuggestion.aiGenerated ? "success" : "info"}
                                action={
                                    <Button color="inherit" size="small" onClick={applyNewTaskSuggestion}>
                                        Apply
                                    </Button>
                                }
                            >
                                <TaskSuggestionDetails suggestion={newTaskSuggestion} />
                            </Alert>
                        )}
                    </Stack>

                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Images
                            </Typography>
                            <Button component="label" size="small" variant="outlined">
                                Add Images
                                <input
                                    hidden
                                    multiple
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={(event) => {
                                        const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"))
                                        setNewTaskImages((prev) => [...prev, ...files])
                                        event.target.value = ""
                                    }}
                                />
                            </Button>
                        </Box>
                        {newTaskImages.length > 0 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {newTaskImages.map((file, index) => (
                                    <Chip
                                        key={`${file.name}-${index}`}
                                        label={file.name}
                                        onDelete={() => setNewTaskImages((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                                        size="small"
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>

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

            <Dialog open={taskDetailsOpen} onClose={() => setTaskDetailsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedTask?.taskKey ? `Task Details - ${selectedTask.taskKey}` : "Task Details"}</DialogTitle>
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

                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={editedTaskSuggestionLoading ? <CircularProgress size={16} /> : <AutoFixHigh />}
                            onClick={requestEditedTaskSuggestion}
                            disabled={!editedTaskTitle.trim() || editedTaskSuggestionLoading}
                        >
                            AI Suggest
                        </Button>
                        {editedTaskSuggestionError && <Alert severity="error">{editedTaskSuggestionError}</Alert>}
                        {editedTaskSuggestion && (
                            <Alert
                                severity={editedTaskSuggestion.aiGenerated ? "success" : "info"}
                                action={
                                    <Button color="inherit" size="small" onClick={applyEditedTaskSuggestion}>
                                        Apply
                                    </Button>
                                }
                            >
                                <TaskSuggestionDetails suggestion={editedTaskSuggestion} />
                            </Alert>
                        )}
                    </Stack>

                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Images
                            </Typography>
                            <Button component="label" size="small" variant="outlined">
                                Upload
                                <input
                                    hidden
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={(event) => {
                                        handleAddAttachment(event.target.files?.[0])
                                        event.target.value = ""
                                    }}
                                />
                            </Button>
                        </Box>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {galleryAttachments.map((attachment) => (
                                <Box key={attachment.id} sx={{ position: "relative" }}>
                                    <Box
                                        component="button"
                                        type="button"
                                        onClick={() => openGallery(attachment.id)}
                                        sx={{
                                            display: "block",
                                            p: 0,
                                            border: 0,
                                            bgcolor: "transparent",
                                            cursor: "pointer",
                                            lineHeight: 0,
                                        }}
                                    >
                                        <AttachmentThumbnail url={attachment.url} name={attachment.fileName} />
                                    </Box>
                                    <IconButton
                                        size="small"
                                        onClick={(event) => handleAttachmentMenuOpen(event, attachment.id)}
                                        sx={{
                                            position: "absolute",
                                            top: 2,
                                            right: 2,
                                            bgcolor: "background.paper",
                                            boxShadow: 1,
                                            "&:hover": { bgcolor: "background.paper" },
                                        }}
                                    >
                                        <MoreHoriz fontSize="small" />
                                    </IconButton>
                                    {attachment.cover && (
                                        <Chip
                                            label="Cover"
                                            size="small"
                                            sx={{
                                                position: "absolute",
                                                left: 4,
                                                bottom: 4,
                                                height: 20,
                                                bgcolor: "background.paper",
                                                fontWeight: 600,
                                            }}
                                        />
                                    )}
                                </Box>
                            ))}
                            {galleryAttachments.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    No images attached
                                </Typography>
                            )}
                        </Box>
                    </Box>

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

            <Menu anchorEl={attachmentMenuAnchor} open={Boolean(attachmentMenuAnchor)} onClose={handleAttachmentMenuClose}>
                <MenuItem onClick={handleSetCover} disabled={selectedAttachment?.cover}>
                    Make cover photo
                </MenuItem>
                <MenuItem onClick={handleDeleteSelectedAttachment} sx={{ color: "error.main" }}>
                    Delete
                </MenuItem>
            </Menu>

            <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                            {galleryAttachment?.fileName || "Image"}
                        </Typography>
                        {galleryAttachments.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                                {galleryIndex + 1} / {galleryAttachments.length}
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={() => setGalleryOpen(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent
                    sx={{
                        minHeight: { xs: 320, sm: 520 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        bgcolor: "background.default",
                    }}
                >
                    <IconButton
                        onClick={() => setGalleryIndex((index) => (index - 1 + galleryAttachments.length) % galleryAttachments.length)}
                        disabled={galleryAttachments.length <= 1}
                    >
                        <ChevronLeft />
                    </IconButton>
                    {galleryAttachment && (
                        <AttachmentThumbnail
                            url={galleryAttachment.url}
                            name={galleryAttachment.fileName}
                            sx={{
                                width: "100%",
                                maxWidth: 760,
                                height: { xs: 280, sm: 480 },
                                objectFit: "contain",
                                bgcolor: "background.paper",
                            }}
                        />
                    )}
                    <IconButton
                        onClick={() => setGalleryIndex((index) => (index + 1) % galleryAttachments.length)}
                        disabled={galleryAttachments.length <= 1}
                    >
                        <ChevronRight />
                    </IconButton>
                </DialogContent>
            </Dialog>
        </LocalizationProvider>
    )
}
