"use client"

import {
  Popover,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material"
import { Close, PersonAdd, AccessTime, Notifications as NotificationsIcon, DoneAll, Delete } from "@mui/icons-material"
import { useNotifications } from "@/contexts/notification-context"
import { useAuth } from "@/contexts/auth-context"

interface NotificationPopoverProps {
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
}

export function NotificationPopover({ anchorEl, open, onClose }: NotificationPopoverProps) {
  const { notifications, markAsRead, markAllAsRead, clearNotification, clearAll, getNotificationsForUser } =
    useNotifications()
  const { currentUser } = useAuth()

  const userNotifications = currentUser ? getNotificationsForUser(currentUser.id) : notifications

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <PersonAdd sx={{ fontSize: 20 }} />
      case "due_reminder":
        return <AccessTime sx={{ fontSize: 20 }} />
      default:
        return <NotificationsIcon sx={{ fontSize: 20 }} />
    }
  }

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      sx={{
        "& .MuiPopover-paper": {
          width: 360,
          maxHeight: 480,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Notifications
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {userNotifications.length > 0 && (
            <>
              <IconButton size="small" onClick={markAllAsRead} title="Mark all as read">
                <DoneAll fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={clearAll} title="Clear all">
                <Delete fontSize="small" />
              </IconButton>
            </>
          )}
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Notification List */}
      {userNotifications.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <NotificationsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No notifications yet
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0, maxHeight: 360, overflow: "auto" }}>
          {userNotifications.map((notification, index) => (
            <Box key={notification.id}>
              <ListItem
                sx={{
                  bgcolor: notification.read ? "transparent" : "action.hover",
                  "&:hover": { bgcolor: "action.selected" },
                  cursor: "pointer",
                }}
                onClick={() => markAsRead(notification.id)}
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearNotification(notification.id)
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemIcon sx={{ minWidth: 40, color: notification.read ? "text.secondary" : "primary.main" }}>
                  {getIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatTimestamp(notification.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < userNotifications.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Popover>
  )
}
