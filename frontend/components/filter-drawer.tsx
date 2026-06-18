"use client"

import {
  Drawer,
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Button,
  IconButton,
  Divider,
  InputAdornment,
} from "@mui/material"
import { Close, Search as SearchIcon, FilterListOff } from "@mui/icons-material"
import { useFilters } from "@/contexts/filter-context"
import { useBoards } from "@/contexts/board-context"
import { useMemo } from "react"
import type { Label } from "@/types/kanban"
import { usePathname } from "next/navigation"

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
}

export function FilterDrawer({ open, onClose }: FilterDrawerProps) {
  const {
    pendingFilters,
    setPendingKeyword,
    setPendingMyTasksOnly,
    togglePendingLabelFilter,
    setPendingDueDateSort,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    hasPendingChanges,
  } = useFilters()

  const { boards } = useBoards()
  const pathname = usePathname()

  const labels = useMemo(() => {
    const boardMatch = pathname.match(/^\/boards\/([^/]+)/)
    if (boardMatch) {
      return boards.find((board) => board.id === boardMatch[1])?.labels || []
    }

    const labelMap = new Map<string, Label>()
    boards.forEach((board) => {
      board.labels.forEach((label) => {
        if (!labelMap.has(label.id)) {
          labelMap.set(label.id, label)
        }
      })
    })
    return Array.from(labelMap.values())
  }, [boards, pathname])

  const handleApplyFilters = () => {
    applyFilters()
    onClose()
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 360 },
          p: 3,
          bgcolor: "background.paper",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filters
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* Keyword Search */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Keyword Search
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search boards and tasks..."
          value={pendingFilters.keyword}
          onChange={(e) => setPendingKeyword(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* My Tasks Toggle */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch checked={pendingFilters.myTasksOnly} onChange={(e) => setPendingMyTasksOnly(e.target.checked)} />
          }
          label={
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                My Tasks Only
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Show only tasks assigned to me
              </Typography>
            </Box>
          }
          sx={{ alignItems: "flex-start", ml: 0 }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Label Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Filter by Labels
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxHeight: 200, overflow: "auto" }}>
          {labels.map((label) => (
            <FormControlLabel
              key={label.id}
              control={
                <Checkbox
                  checked={pendingFilters.selectedLabelIds.includes(label.id)}
                  onChange={() => togglePendingLabelFilter(label.id)}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: label.color,
                    }}
                  />
                  <Typography variant="body2">{label.name}</Typography>
                </Box>
              }
            />
          ))}
          {labels.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No labels available
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Due Date Sort */}
      <Box sx={{ mb: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>
            Sort by Due Date
          </FormLabel>
          <RadioGroup
            value={pendingFilters.dueDateSort}
            onChange={(e) => setPendingDueDateSort(e.target.value as typeof pendingFilters.dueDateSort)}
          >
            <FormControlLabel value="none" control={<Radio size="small" />} label="None" />
            <FormControlLabel value="closest" control={<Radio size="small" />} label="Closest Due Date First" />
            <FormControlLabel value="furthest" control={<Radio size="small" />} label="Furthest Due Date First" />
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: "auto", pt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        <Button variant="contained" onClick={handleApplyFilters} fullWidth disabled={!hasPendingChanges}>
          Apply Filters
        </Button>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<FilterListOff />}
            onClick={() => {
              resetFilters()
              onClose()
            }}
            fullWidth
          >
            Clear All Filters
          </Button>
        )}
      </Box>
    </Drawer>
  )
}
