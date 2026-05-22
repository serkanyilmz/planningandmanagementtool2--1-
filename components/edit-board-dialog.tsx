"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
} from "@mui/material"

// 10 preset colors
const PRESET_COLORS = [
  "#002366", // National Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#84cc16", // Lime
  "#64748b", // Slate
  "#f97316", // Orange
]

interface EditBoardDialogProps {
  open: boolean
  onClose: () => void
  board: { id: string; title: string; color: string } | null
  onSave: (id: string, title: string, color: string) => void
}

export function EditBoardDialog({ open, onClose, board, onSave }: EditBoardDialogProps) {
  const [title, setTitle] = useState("")
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [customHex, setCustomHex] = useState("")
  const [hexError, setHexError] = useState("")

  useEffect(() => {
    if (board) {
      setTitle(board.title)
      setSelectedColor(board.color)
      // If the board color is not in presets, show it in custom hex
      if (!PRESET_COLORS.includes(board.color)) {
        setCustomHex(board.color)
      } else {
        setCustomHex("")
      }
    }
  }, [board])

  const validateHex = (hex: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex)
  }

  const handleHexChange = (value: string) => {
    setCustomHex(value)
    setHexError("")

    if (value && !value.startsWith("#")) {
      setHexError("Hex code must start with #")
      return
    }

    if (value && value.length > 1 && !validateHex(value)) {
      if (value.length === 7) {
        setHexError("Invalid hex code format")
      }
      return
    }

    if (validateHex(value)) {
      setSelectedColor(value)
    }
  }

  const handlePresetClick = (color: string) => {
    setSelectedColor(color)
    setCustomHex("")
    setHexError("")
  }

  const handleSave = () => {
    if (board && title.trim()) {
      onSave(board.id, title.trim(), selectedColor)
      onClose()
    }
  }

  const handleClose = () => {
    setHexError("")
    setCustomHex("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Board</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Board Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Choose a Color
        </Typography>

        {/* Preset Colors */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {PRESET_COLORS.map((color) => (
            <Box
              key={color}
              onClick={() => handlePresetClick(color)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: color,
                cursor: "pointer",
                border: selectedColor === color ? "3px solid" : "2px solid transparent",
                borderColor: selectedColor === color ? "primary.main" : "transparent",
                outline: selectedColor === color ? "2px solid white" : "none",
                transition: "all 0.2s",
                "&:hover": { transform: "scale(1.1)" },
              }}
            />
          ))}
        </Box>

        {/* Custom Hex Input */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Or Enter Custom Hex
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            size="small"
            placeholder="#FF5733"
            value={customHex}
            onChange={(e) => handleHexChange(e.target.value)}
            error={!!hexError}
            helperText={hexError}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      bgcolor: validateHex(customHex) ? customHex : "#ccc",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Color Preview */}
        <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Preview:
          </Typography>
          <Box
            sx={{
              width: 48,
              height: 32,
              borderRadius: 1,
              bgcolor: selectedColor,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
            {selectedColor}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!title.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
