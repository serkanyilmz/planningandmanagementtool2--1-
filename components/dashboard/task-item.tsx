import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskItemProps {
  title: string
  board: string
  dueDate: string
  priority: "High" | "Medium" | "Low"
  assignee: {
    name: string
    avatar?: string
    initials: string
  }
}

const priorityStyles = {
  High: "bg-[oklch(0.55_0.22_25)] text-[oklch(0.98_0_0)]",
  Medium: "bg-[oklch(0.75_0.15_80)] text-[oklch(0.15_0.02_250)]",
  Low: "bg-[oklch(0.55_0.12_180)] text-[oklch(0.98_0_0)]",
}

export function TaskItem({ title, board, dueDate, priority, assignee }: TaskItemProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-card-foreground truncate">{title}</h4>
        <p className="text-sm text-muted-foreground">{board}</p>
      </div>

      <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
        <Calendar className="h-4 w-4" />
        <span>{dueDate}</span>
      </div>

      <Badge className={cn("shrink-0", priorityStyles[priority])}>{priority}</Badge>

      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={assignee.avatar || "/placeholder.svg"} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">{assignee.initials}</AvatarFallback>
      </Avatar>
    </div>
  )
}
