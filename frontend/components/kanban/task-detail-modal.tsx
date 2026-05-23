"use client"

import { useState } from "react"
import {
  Sparkles,
  Users,
  Calendar,
  UserPlus,
  CheckSquare,
  MessageSquare,
  X,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { TaskDetail } from "@/types/kanban"

interface TaskDetailModalProps {
  task: TaskDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const priorityConfig = {
  high: { icon: ArrowUp, color: "text-red-500", label: "High" },
  medium: { icon: ArrowRight, color: "text-amber-500", label: "Medium" },
  low: { icon: ArrowDown, color: "text-teal-500", label: "Low" },
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [checklist, setChecklist] = useState(task?.checklist || [])
  const [newComment, setNewComment] = useState("")

  if (!task) return null

  const completedItems = checklist.filter((item) => item.completed).length
  const progress = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0
  const PriorityIcon = priorityConfig[task.priority].icon

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold border-none px-0 focus-visible:ring-0 bg-transparent"
                placeholder="Task title"
              />
              <div className="flex items-center gap-2 mt-2">
                {task.labels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Description
              </h3>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a more detailed description..."
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Checklist */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Checklist
                <Badge variant="secondary" className="ml-auto">
                  {completedItems}/{checklist.length}
                </Badge>
              </h3>
              <Progress value={progress} className="h-2 mb-3" />
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      id={item.id}
                    />
                    <label
                      htmlFor={item.id}
                      className={`text-sm flex-1 cursor-pointer ${
                        item.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.text}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Activity
              </h3>

              {/* New Comment Input */}
              <div className="flex gap-3 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.png" alt="You" />
                  <AvatarFallback>YO</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full"
                  />
                </div>
              </div>

              {/* Activity Stream */}
              <div className="space-y-4">
                {task.activity.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={item.user.avatar || "/placeholder.svg"} alt={item.user.name} />
                      <AvatarFallback className="text-xs">
                        {item.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">{item.user.name}</span>
                        <span className="text-xs text-muted-foreground">{formatTimestamp(item.timestamp)}</span>
                      </div>
                      {item.comment ? (
                        <p className="text-sm mt-1 p-3 bg-muted rounded-md">{item.comment}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">{item.action}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* AI Advisor Card */}
            <div className="relative overflow-hidden rounded-lg border-2 border-transparent bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-[1px]">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-50 blur-sm" />
              <div className="relative bg-card rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Smart Suggestions</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Based on the description and deadline, we recommend setting{" "}
                  <span className="font-medium text-foreground">Priority to High</span>.
                </p>
                <Button size="sm" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Sparkles className="h-3 w-3 mr-2" />
                  Apply Suggestion
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</h4>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <UserPlus className="h-4 w-4 mr-2" />
                Join
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Users className="h-4 w-4 mr-2" />
                Members
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Calendar className="h-4 w-4 mr-2" />
                Dates
              </Button>
            </div>

            {/* Task Info */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                <div className={`flex items-center gap-1 ${priorityConfig[task.priority].color}`}>
                  <PriorityIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{priorityConfig[task.priority].label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <span className="text-sm font-medium">
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Assignees</span>
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map((assignee) => (
                    <div key={assignee.id} className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                        <AvatarFallback className="text-[10px]">
                          {assignee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{assignee.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
