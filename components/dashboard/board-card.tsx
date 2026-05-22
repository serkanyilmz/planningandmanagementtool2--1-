"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  IconButton,
  Avatar,
  AvatarGroup,
  Box,
  Menu,
  MenuItem,
} from "@mui/material"
import { MoreVert, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material"
import { useBoards } from "@/contexts/board-context"
import { EditBoardDialog } from "@/components/edit-board-dialog"

interface BoardCardProps {
  id: string
  title: string
  color: string
  listCount: number
  taskCount: number
  membersCount: number
}

export function BoardCard({ id, title, color, listCount, taskCount, membersCount }: BoardCardProps) {
  const router = useRouter()
  const { updateBoard, deleteBoard } = useBoards()

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleClick = () => {
    router.push(`/boards/${id}`)
  }

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  const handleEditClick = () => {
    handleMenuClose()
    setEditDialogOpen(true)
  }

  const handleDeleteClick = () => {
    handleMenuClose()
    deleteBoard(id)
  }

  const handleSaveBoard = (boardId: string, newTitle: string, newColor: string) => {
    updateBoard(boardId, { title: newTitle, color: newColor })
  }

  return (
    <>
      <Card sx={{ overflow: "hidden", transition: "all 0.2s", "&:hover": { boxShadow: 4 } }}>
        <CardActionArea onClick={handleClick}>
          <Box
            sx={{
              height: 96,
              bgcolor: color,
              p: 2,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 28, height: 28, fontSize: 12 } }}>
              {Array.from({ length: Math.min(membersCount, 3) }).map((_, i) => (
                <Avatar key={i} src={`/placeholder.svg?height=28&width=28&query=user avatar ${i + 1}`} />
              ))}
            </AvatarGroup>
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ opacity: 0, transition: "opacity 0.2s", ".MuiCard-root:hover &": { opacity: 1 }, color: "white" }}
            >
              <MoreVert />
            </IconButton>
          </Box>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {listCount} Lists • {taskCount} Tasks
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Board
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Board
        </MenuItem>
      </Menu>

      <EditBoardDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        board={{ id, title, color }}
        onSave={handleSaveBoard}
      />
    </>
  )
}
