"use client"

import type React from "react"

import { useState } from "react"
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material"
import { Add as AddIcon } from "@mui/icons-material"
import { Column } from "./column"
import type { BoardData, Task, Assignee, Label } from "@/types/kanban"

interface KanbanBoardProps {
  boardId: string
  boardData: BoardData
  boardMembers: Assignee[]
  boardLabels: Label[]
  onAddList: (title: string) => void
  onRenameList: (listId: string, newTitle: string) => void
  onDeleteList: (listId: string) => void
  onClearListTasks: (listId: string) => void
  onReorderLists: (listIds: string[]) => void
  onAddTask: (listId: string, task: Omit<Task, "id">) => Promise<Task | null> | void
  onUpdateTask: (listId: string, taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (listId: string, taskId: string) => void
  onMoveTask: (fromListId: string, toListId: string, taskId: string) => void
  onAddTaskAttachment?: (taskId: string, file: File) => void
  onSetTaskAttachmentCover?: (taskId: string, attachmentId: string) => void
  onDeleteTaskAttachment?: (taskId: string, attachmentId: string) => void
  canManageLists?: boolean
}

export function KanbanBoard({
  boardId,
  boardData,
  boardMembers,
  boardLabels,
  onAddList,
  onRenameList,
  onDeleteList,
  onClearListTasks,
  onReorderLists,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onAddTaskAttachment,
  onSetTaskAttachmentCover,
  onDeleteTaskAttachment,
  canManageLists = true,
}: KanbanBoardProps) {
  const [addListDialogOpen, setAddListDialogOpen] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; fromListId: string } | null>(null)
  const [draggedListId, setDraggedListId] = useState<string | null>(null)

  const handleAddList = () => {
    setAddListDialogOpen(true)
  }

  const handleConfirmAddList = () => {
    if (newListName.trim()) {
      onAddList(newListName.trim())
      setNewListName("")
      setAddListDialogOpen(false)
    }
  }

  const handleTaskDragStart = (e: React.DragEvent, taskId: string, fromListId: string) => {
    setDraggedTask({ taskId, fromListId })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, toListId: string) => {
    e.preventDefault()
    if (draggedTask && draggedTask.fromListId !== toListId) {
      onMoveTask(draggedTask.fromListId, toListId, draggedTask.taskId)
    }
    setDraggedTask(null)
  }

  const handleListDragStart = (e: React.DragEvent, listId: string) => {
    if (!canManageLists) return
    setDraggedListId(listId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleListDrop = (e: React.DragEvent, toListId: string) => {
    e.preventDefault()
    if (!draggedListId || draggedListId === toListId) {
      setDraggedListId(null)
      return
    }
    const nextListIds = boardData.lists.map((list) => list.id)
    const fromIndex = nextListIds.indexOf(draggedListId)
    const toIndex = nextListIds.indexOf(toListId)
    if (fromIndex === -1 || toIndex === -1) return
    const [moved] = nextListIds.splice(fromIndex, 1)
    nextListIds.splice(toIndex, 0, moved)
    onReorderLists(nextListIds)
    setDraggedListId(null)
  }

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, height: "100%", overflow: "auto", pb: 2 }}>
        {boardData.lists.map((list) => (
          <Column
            key={list.id}
            list={list}
            boardId={boardId}
            boardMembers={boardMembers}
            boardLabels={boardLabels}
            onRename={(newTitle) => onRenameList(list.id, newTitle)}
            onDelete={() => onDeleteList(list.id)}
            onClearTasks={() => onClearListTasks(list.id)}
            onListDragStart={(e) => handleListDragStart(e, list.id)}
            onListDrop={(e) => handleListDrop(e, list.id)}
            onAddTask={(task) => onAddTask(list.id, task)}
            onUpdateTask={(taskId, updates) => onUpdateTask(list.id, taskId, updates)}
            onDeleteTask={(taskId) => onDeleteTask(list.id, taskId)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onTaskDragStart={handleTaskDragStart}
            canManageLists={canManageLists}
            onAddTaskAttachment={onAddTaskAttachment}
            onSetTaskAttachmentCover={onSetTaskAttachmentCover}
            onDeleteTaskAttachment={onDeleteTaskAttachment}
          />
        ))}

        {/* Add List Button */}
        <Box sx={{ flexShrink: 0 }}>
          <Button
            variant="outlined"
            onClick={handleAddList}
            sx={{
              width: 288,
              height: 80,
              flexDirection: "column",
              gap: 1,
              borderStyle: "dashed",
              color: "text.secondary",
              "&:hover": { borderColor: "primary.main", color: "primary.main" },
            }}
          >
            <AddIcon />
            Add List
          </Button>
        </Box>
      </Box>

      <Dialog open={addListDialogOpen} onClose={() => setAddListDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="List Name"
            fullWidth
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirmAddList()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddListDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmAddList} disabled={!newListName.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
