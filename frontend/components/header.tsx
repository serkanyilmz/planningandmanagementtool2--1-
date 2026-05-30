"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Badge,
  Menu,
  MenuItem,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material"
import {
  Add as AddIcon,
  Notifications as NotificationsIcon,
  KeyboardArrowDown,
  LightMode,
  DarkMode,
  Layers as LayersIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material"
import { useState } from "react"
import { useTheme } from "@/contexts/theme-context"
import { useBoards } from "@/contexts/board-context"
import { useAuth } from "@/contexts/auth-context"
import { useFilters } from "@/contexts/filter-context"
import { useNotifications } from "@/contexts/notification-context"
import { FilterDrawer } from "@/components/filter-drawer"
import { NotificationPopover } from "@/components/notification-popover"

// 10 preset colors
const BOARD_COLORS = [
  "#002366",
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

export function Header() {
  const router = useRouter()
  const { mode, toggleTheme } = useTheme()
  const { createBoard } = useBoards()
  const { currentUser } = useAuth()
  const { hasActiveFilters } = useFilters()
  const { unreadCount } = useNotifications()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [newBoardDialogOpen, setNewBoardDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0])
  const [customHex, setCustomHex] = useState("")
  const [hexError, setHexError] = useState("")

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleCreateBoard = () => {
    handleMenuClose()
    setNewBoardDialogOpen(true)
  }

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

    if (validateHex(value)) {
      setSelectedColor(value)
    } else if (value.length === 7) {
      setHexError("Invalid hex code format")
    }
  }

  const handlePresetClick = (color: string) => {
    setSelectedColor(color)
    setCustomHex("")
    setHexError("")
  }

  const handleConfirmCreateBoard = async () => {
    if (newBoardName.trim()) {
      const newBoard = await createBoard(newBoardName.trim(), selectedColor, currentUser?.id || "")
      setNewBoardDialogOpen(false)
      setNewBoardName("")
      setSelectedColor(BOARD_COLORS[0])
      setCustomHex("")
      setHexError("")
      if (newBoard) {
        router.push(`/boards/${newBoard.id}`)
      }
    }
  }

  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget)
  }

  return (
    <>
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Link href="/home" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: "primary.main",
              }}
            >
              <LayersIcon sx={{ fontSize: 20, color: "white" }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: "text.primary",
                display: { xs: "none", sm: "block" },
              }}
            >
              Planify
            </Typography>
          </Link>

          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDrawerOpen(true)}
            sx={{
              display: { xs: "none", md: "flex" },
              minWidth: 120,
            }}
          >
            Filter
            {hasActiveFilters && (
              <Box
                sx={{
                  ml: 1,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                }}
              />
            )}
          </Button>

          {/* Mobile filter button */}
          <IconButton onClick={() => setFilterDrawerOpen(true)} sx={{ display: { xs: "flex", md: "none" } }}>
            <Badge variant="dot" invisible={!hasActiveFilters} color="primary">
              <FilterListIcon />
            </Badge>
          </IconButton>

          <Box sx={{ flex: 1 }} />

          {/* Right side actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === "light" ? <DarkMode /> : <LightMode />}
            </IconButton>

            {/* Create button */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              endIcon={<KeyboardArrowDown />}
              onClick={handleMenuOpen}
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              Create
            </Button>
            <IconButton color="primary" onClick={handleMenuOpen} sx={{ display: { xs: "flex", sm: "none" } }}>
              <AddIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={handleCreateBoard}>
                <AddIcon sx={{ mr: 1 }} fontSize="small" />
                New Board
              </MenuItem>
            </Menu>

            <IconButton onClick={handleNotificationsClick}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog open={newBoardDialogOpen} onClose={() => setNewBoardDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Board</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Board Name"
            fullWidth
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirmCreateBoard()}
            sx={{ mb: 3 }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Choose a color
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {BOARD_COLORS.map((color) => (
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
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Or enter custom hex
          </Typography>
          <TextField
            size="small"
            placeholder="#FF5733"
            value={customHex}
            onChange={(e) => handleHexChange(e.target.value)}
            error={!!hexError}
            helperText={hexError}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      bgcolor: selectedColor,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewBoardDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmCreateBoard} disabled={!newBoardName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <FilterDrawer open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} />

      <NotificationPopover
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={() => setNotificationAnchorEl(null)}
      />
    </>
  )
}
