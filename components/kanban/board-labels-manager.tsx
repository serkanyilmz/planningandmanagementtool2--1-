"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
} from "@mui/material"
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Close } from "@mui/icons-material"
import { useBoards } from "@/contexts/board-context"
import type { Label } from "@/types/kanban"

// 10 preset colors for labels
const PRESET_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#64748b",
  "#f97316",
]

interface BoardLabelsManagerProps {
  open: boolean
  onClose: () => void
  boardId: string
  labels: Label[]
}

export function BoardLabelsManager({ open, onClose, boardId, labels }: BoardLabelsManagerProps) {
  const { addLabelToBoard, updateBoardLabel, deleteBoardLabel } = useBoards()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [customHex, setCustomHex] = useState("")
  const [hexError, setHexError] = useState("")

  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [newCustomHex, setNewCustomHex] = useState("")
  const [newHexError, setNewHexError] = useState("")

  const validateHex = (hex: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex)
  }

  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingId(id)
    setEditName(name)
    setEditColor(color)
    if (!PRESET_COLORS.includes(color)) {
      setCustomHex(color)
    } else {
      setCustomHex("")
    }
    setHexError("")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditColor("")
    setCustomHex("")
    setHexError("")
  }

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      updateBoardLabel(boardId, editingId, { name: editName.trim(), color: editColor })
      handleCancelEdit()
    }
  }

  const handleEditHexChange = (value: string) => {
    setCustomHex(value)
    setHexError("")

    if (value && !value.startsWith("#")) {
      setHexError("Must start with #")
      return
    }

    if (validateHex(value)) {
      setEditColor(value)
    } else if (value.length === 7) {
      setHexError("Invalid hex code")
    }
  }

  const handleNewHexChange = (value: string) => {
    setNewCustomHex(value)
    setNewHexError("")

    if (value && !value.startsWith("#")) {
      setNewHexError("Must start with #")
      return
    }

    if (validateHex(value)) {
      setNewColor(value)
    } else if (value.length === 7) {
      setNewHexError("Invalid hex code")
    }
  }

  const handleStartCreate = () => {
    setIsCreating(true)
    setNewName("")
    setNewColor(PRESET_COLORS[0])
    setNewCustomHex("")
    setNewHexError("")
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewName("")
    setNewColor(PRESET_COLORS[0])
    setNewCustomHex("")
    setNewHexError("")
  }

  const handleConfirmCreate = () => {
    if (newName.trim()) {
      addLabelToBoard(boardId, newName.trim(), newColor)
      handleCancelCreate()
    }
  }

  const handleDelete = (id: string) => {
    deleteBoardLabel(boardId, id)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Manage Board Labels
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create, edit, or delete labels for this board. These labels are specific to this board only.
        </Typography>

        {/* Labels List */}
        <List sx={{ mb: 2 }}>
          {labels.map((label) => (
            <ListItem
              key={label.id}
              sx={{
                bgcolor: "action.hover",
                borderRadius: 1,
                mb: 1,
                flexDirection: "column",
                alignItems: "stretch",
              }}
            >
              {editingId === label.id ? (
                // Edit Mode
                <Box sx={{ width: "100%" }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    label="Label Name"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="caption" sx={{ mb: 1, display: "block", fontWeight: 600 }}>
                    Choose Color
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1.5 }}>
                    {PRESET_COLORS.map((color) => (
                      <Box
                        key={color}
                        onClick={() => {
                          setEditColor(color)
                          setCustomHex("")
                          setHexError("")
                        }}
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: color,
                          cursor: "pointer",
                          border: editColor === color ? "2px solid" : "1px solid transparent",
                          borderColor: editColor === color ? "primary.main" : "transparent",
                          "&:hover": { transform: "scale(1.1)" },
                        }}
                      />
                    ))}
                  </Box>
                  <TextField
                    size="small"
                    placeholder="#FF5733"
                    value={customHex}
                    onChange={(e) => handleEditHexChange(e.target.value)}
                    error={!!hexError}
                    helperText={hexError}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              bgcolor: editColor,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Button size="small" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={handleSaveEdit} disabled={!editName.trim()}>
                      Save
                    </Button>
                  </Box>
                </Box>
              ) : (
                // Display Mode
                <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: label.color,
                      mr: 2,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText
                    primary={label.name}
                    secondary={label.color}
                    secondaryTypographyProps={{ sx: { fontFamily: "monospace", fontSize: 11 } }}
                  />
                  <IconButton size="small" onClick={() => handleStartEdit(label.id, label.name, label.color)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(label.id)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </ListItem>
          ))}
          {labels.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
              No labels yet. Create one to get started.
            </Typography>
          )}
        </List>

        {/* Create New Label */}
        {isCreating ? (
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Create New Label
            </Typography>
            <TextField
              size="small"
              fullWidth
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              label="Label Name"
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" sx={{ mb: 1, display: "block", fontWeight: 600 }}>
              Choose Color
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1.5 }}>
              {PRESET_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => {
                    setNewColor(color)
                    setNewCustomHex("")
                    setNewHexError("")
                  }}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: color,
                    cursor: "pointer",
                    border: newColor === color ? "2px solid" : "1px solid transparent",
                    borderColor: newColor === color ? "primary.main" : "transparent",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                />
              ))}
            </Box>
            <TextField
              size="small"
              placeholder="#FF5733"
              value={newCustomHex}
              onChange={(e) => handleNewHexChange(e.target.value)}
              error={!!newHexError}
              helperText={newHexError}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        bgcolor: newColor,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button size="small" onClick={handleCancelCreate}>
                Cancel
              </Button>
              <Button size="small" variant="contained" onClick={handleConfirmCreate} disabled={!newName.trim()}>
                Create
              </Button>
            </Box>
          </Box>
        ) : (
          <Button startIcon={<AddIcon />} onClick={handleStartCreate} fullWidth variant="outlined">
            Add New Label
          </Button>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}
