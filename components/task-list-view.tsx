"use client"

import { Box, Card, CardContent, Typography, Chip, Avatar, AvatarGroup } from "@mui/material"
import { ArrowUpward, ArrowForward, ArrowDownward, CalendarToday } from "@mui/icons-material"
import type { Task } from "@/types/kanban"

interface TaskWithBoard extends Task {
  boardId: string
  boardTitle: string
  boardColor: string
  listTitle: string
}

interface TaskListViewProps {
  tasks: TaskWithBoard[]
  onTaskClick?: (task: TaskWithBoard) => void
}

const priorityConfig = {
  high: { icon: ArrowUpward, color: "#ef4444" },
  medium: { icon: ArrowForward, color: "#f59e0b" },
  low: { icon: ArrowDownward, color: "#10b981" },
}

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (tasks.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          No tasks match your filters.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {tasks.map((task) => {
        const PriorityIcon = priorityConfig[task.priority].icon
        const priorityColor = priorityConfig[task.priority].color

        return (
          <Card
            key={`${task.boardId}-${task.id}`}
            onClick={() => onTaskClick?.(task)}
            sx={{
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                boxShadow: 3,
                borderColor: "primary.light",
              },
            }}
          >
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              {/* Board Badge */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: task.boardColor,
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  From: {task.boardTitle} / {task.listTitle}
                </Typography>
              </Box>

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
              <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.4, mb: 1 }}>
                {task.title}
              </Typography>

              {/* Description Preview */}
              {task.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {task.description}
                </Typography>
              )}

              {/* Metadata Row */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {/* Priority Icon */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PriorityIcon sx={{ fontSize: 16, color: priorityColor }} />
                    <Typography variant="caption" sx={{ color: priorityColor, fontWeight: 500 }}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Typography>
                  </Box>

                  {/* Due Date */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                    <CalendarToday sx={{ fontSize: 14 }} />
                    <Typography variant="caption">{formatDate(task.dueDate)}</Typography>
                  </Box>
                </Box>

                {/* Assignees */}
                {task.assignees.length > 0 && (
                  <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 28, height: 28, fontSize: 11 } }}>
                    {task.assignees.map((assignee) => (
                      <Avatar
                        key={assignee.id}
                        alt={assignee.name}
                        src={assignee.avatar || "/placeholder.svg"}
                        sx={{ bgcolor: "primary.main" }}
                      >
                        {assignee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                )}
              </Box>
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}
