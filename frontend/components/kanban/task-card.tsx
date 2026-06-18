"use client"

import type React from "react"

import { Card, CardContent, Chip, Typography, Avatar, AvatarGroup, Box } from "@mui/material"
import { ArrowUpward, ArrowForward, ArrowDownward, CalendarToday, DragIndicator } from "@mui/icons-material"
import type { Task } from "@/types/kanban"
import { useAuth } from "@/contexts/auth-context"
import { useProtectedImage } from "@/hooks/use-protected-image"

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragging?: boolean
}

const priorityConfig = {
  high: {
    icon: ArrowUpward,
    color: "#ef4444",
  },
  medium: {
    icon: ArrowForward,
    color: "#f59e0b",
  },
  low: {
    icon: ArrowDownward,
    color: "#10b981",
  },
}

function AssigneeAvatar({ assignee, token }: { assignee: Task["assignees"][number]; token: string | null }) {
  const src = useProtectedImage(assignee.avatar, token)

  return (
    <Avatar key={assignee.id} alt={assignee.name} src={src || undefined} sx={{ bgcolor: "primary.main" }}>
      {assignee.name
        .split(" ")
        .map((n) => n[0])
        .join("")}
    </Avatar>
  )
}

export function TaskCard({ task, onClick, onDragStart, onDragEnd, isDragging }: TaskCardProps) {
  const { token } = useAuth()
  const PriorityIcon = priorityConfig[task.priority].icon
  const priorityColor = priorityConfig[task.priority].color
  const coverAttachment = task.attachments?.find((attachment) => attachment.cover) || task.attachments?.[0]
  const coverSrc = useProtectedImage(coverAttachment?.url, token)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      sx={{
        cursor: "grab",
        transition: "all 0.2s",
        opacity: isDragging ? 0.5 : 1,
        "&:hover": {
          boxShadow: 3,
          borderColor: "primary.light",
        },
        "&:active": { cursor: "grabbing" },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <DragIndicator sx={{ fontSize: 16, color: "text.disabled", mt: 0.5 }} />
          <Box sx={{ flex: 1 }}>
            {coverAttachment && (
              <Box
                sx={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  borderRadius: 1,
                  overflow: "hidden",
                  bgcolor: "action.hover",
                  mb: 1.5,
                }}
              >
                {coverSrc && (
                  <Box
                    component="img"
                    src={coverSrc}
                    alt={coverAttachment.fileName}
                    sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
              </Box>
            )}

            {/* Labels */}
            {task.labels.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                {task.labels.map((label) => (
                  <Chip
                    key={label.id}
                    label={label.name}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 11,
                      fontWeight: 500,
                      bgcolor: label.color,
                      color: "white",
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Title */}
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
              {task.title}
            </Typography>

            {/* Metadata Row */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {/* Priority Icon */}
                <PriorityIcon sx={{ fontSize: 16, color: priorityColor }} />

                {/* Due Date */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                  <CalendarToday sx={{ fontSize: 12 }} />
                  <Typography variant="caption">{formatDate(task.dueDate)}</Typography>
                </Box>
              </Box>

              {/* Assignees */}
              {task.assignees.length > 0 && (
                <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 24, height: 24, fontSize: 10 } }}>
                  {task.assignees.map((assignee) => (
                    <AssigneeAvatar key={assignee.id} assignee={assignee} token={token} />
                  ))}
                </AvatarGroup>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
