"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Box,
  Divider,
  SwipeableDrawer,
  Menu,
  MenuItem,
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Layers as LayersIcon,
  MoreVert,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/auth-context"
import { useBoards } from "@/contexts/board-context"
import { EditBoardDialog } from "@/components/edit-board-dialog"
import { useProtectedImage } from "@/hooks/use-protected-image"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: DashboardIcon, label: "Boards", href: "/home" },
  { icon: SettingsIcon, label: "Settings", href: "/settings" },
]

const drawerWidth = 256
const collapsedWidth = 64

interface SidebarContentProps {
  collapsed: boolean
  onToggle?: () => void
  onNavigate?: () => void
}

function SidebarContent({ collapsed, onToggle, onNavigate }: SidebarContentProps) {
  const router = useRouter()
  const { currentUser, logout, token } = useAuth()
  const { getBoardsForUser, updateBoard, deleteBoard } = useBoards()
  const profileImageSrc = useProtectedImage(currentUser?.profileImageUrl, token)

  const userBoards = currentUser ? getBoardsForUser(currentUser.id) : []

  const [boardMenuAnchor, setBoardMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedBoard, setSelectedBoard] = useState<{ id: string; title: string; color: string } | null>(null)
  const [editBoardDialogOpen, setEditBoardDialogOpen] = useState(false)

  const handleNavClick = (href: string) => {
    router.push(href)
    onNavigate?.()
  }

  const handleBoardClick = (boardId: string) => {
    router.push(`/boards/${boardId}`)
    onNavigate?.()
  }

  const handleLogoClick = () => {
    router.push("/home")
    onNavigate?.()
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleProfileClick = () => {
    router.push("/settings")
    onNavigate?.()
  }

  const getUserInitials = () => {
    if (currentUser?.name) {
      return currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return "?"
  }

  const handleBoardMenuOpen = (event: React.MouseEvent<HTMLElement>, board: typeof selectedBoard) => {
    event.stopPropagation()
    setBoardMenuAnchor(event.currentTarget)
    setSelectedBoard(board)
  }

  const handleBoardMenuClose = () => {
    setBoardMenuAnchor(null)
  }

  const handleEditBoard = () => {
    handleBoardMenuClose()
    setEditBoardDialogOpen(true)
  }

  const handleDeleteBoard = () => {
    if (selectedBoard) {
      deleteBoard(selectedBoard.id)
    }
    handleBoardMenuClose()
    setSelectedBoard(null)
  }

  const handleSaveBoard = (id: string, title: string, color: string) => {
    updateBoard(id, { title, color })
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: "#0f172a",
          color: "#f1f5f9",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            px: 2,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {!collapsed && (
            <Box
              onClick={handleLogoClick}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
                "&:hover": { opacity: 0.8 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  bgcolor: "primary.main",
                }}
              >
                <LayersIcon sx={{ fontSize: 18, color: "white" }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: "-0.025em" }}>
                Planify
              </Typography>
            </Box>
          )}
          {collapsed && (
            <Box
              onClick={handleLogoClick}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                cursor: "pointer",
                "&:hover": { opacity: 0.8 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  bgcolor: "primary.main",
                }}
              >
                <LayersIcon sx={{ fontSize: 18, color: "white" }} />
              </Box>
            </Box>
          )}
          {onToggle && !collapsed && (
            <IconButton onClick={onToggle} sx={{ color: "#f1f5f9", display: { xs: "none", lg: "flex" } }} size="small">
              <ChevronLeft />
            </IconButton>
          )}
          {onToggle && collapsed && (
            <IconButton
              onClick={onToggle}
              sx={{ color: "#f1f5f9", display: { xs: "none", lg: "flex" }, position: "absolute", right: 4 }}
              size="small"
            >
              <ChevronRight />
            </IconButton>
          )}
        </Box>

        {/* Navigation */}
        <List sx={{ flex: 1, py: 1, overflow: "auto" }}>
          {navItems.map((item) => (
            <ListItem key={item.label} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.href)}
                sx={{
                  borderRadius: 1,
                  minHeight: 44,
                  justifyContent: collapsed ? "center" : "initial",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 2,
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  <item.icon />
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.label} sx={{ "& .MuiTypography-root": { fontSize: 14 } }} />}
              </ListItemButton>
            </ListItem>
          ))}

          {!collapsed && (
            <>
              <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />
              <ListItem sx={{ px: 2 }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                  Boards
                </Typography>
              </ListItem>
              {userBoards.map((board) => (
                <ListItem key={board.id} disablePadding sx={{ px: 1 }}>
                  <ListItemButton
                    onClick={() => handleBoardClick(board.id)}
                    sx={{
                      borderRadius: 1,
                      minHeight: 40,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: "#94a3b8" }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: board.color,
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={board.title} sx={{ "& .MuiTypography-root": { fontSize: 14 } }} />
                    <IconButton
                      size="small"
                      onClick={(e) => handleBoardMenuOpen(e, { id: board.id, title: board.title, color: board.color })}
                      sx={{
                        color: "#64748b",
                        opacity: 0,
                        ".MuiListItemButton-root:hover &": { opacity: 1 },
                      }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </>
          )}
        </List>

        <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.1)", p: 1.5 }}>
          <Box
            onClick={handleProfileClick}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1,
              borderRadius: 1,
              cursor: "pointer",
              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <Avatar src={profileImageSrc || undefined} sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 12 }}>
              {getUserInitials()}
            </Avatar>
            {!collapsed && (
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {currentUser?.name || ""}
                </Typography>
                <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                  {currentUser?.email || ""}
                </Typography>
              </Box>
            )}
            {!collapsed && (
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation()
                  handleLogout()
                }}
                sx={{ color: "#cbd5e1" }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      <Menu anchorEl={boardMenuAnchor} open={Boolean(boardMenuAnchor)} onClose={handleBoardMenuClose}>
        <MenuItem onClick={handleEditBoard}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Board
        </MenuItem>
        <MenuItem onClick={handleDeleteBoard} sx={{ color: "error.main" }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Board
        </MenuItem>
      </Menu>

      <EditBoardDialog
        open={editBoardDialogOpen}
        onClose={() => setEditBoardDialogOpen(false)}
        board={selectedBoard}
        onSave={handleSaveBoard}
      />
    </>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: "fixed",
            left: 16,
            top: 16,
            zIndex: 1200,
            bgcolor: "background.paper",
            boxShadow: 1,
            "&:hover": { bgcolor: "background.paper" },
          }}
        >
          <MenuIcon />
        </IconButton>
        <SwipeableDrawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          onOpen={() => setMobileOpen(true)}
          sx={{ "& .MuiDrawer-paper": { width: drawerWidth } }}
        >
          <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SwipeableDrawer>
      </>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: collapsed ? collapsedWidth : drawerWidth,
          boxSizing: "border-box",
          transition: "width 0.3s ease",
          overflow: "hidden",
        },
      }}
    >
      <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
    </Drawer>
  )
}
