export interface Label {
  id: string
  name: string
  color: string
}

export interface Assignee {
  id: string
  name: string
  avatar: string
}

export interface Task {
  id: string
  title: string
  description?: string
  labels: Label[]
  priority: "high" | "medium" | "low"
  dueDate: string
  assignees: Assignee[]
  reminderBefore?: "1_day" | "2_hours" | "1_hour" | "none"
}

export interface List {
  id: string
  title: string
  tasks: Task[]
}

export interface BoardData {
  lists: List[]
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface ActivityItem {
  id: string
  user: Assignee
  action: string
  timestamp: string
  comment?: string
}

export interface TaskDetail extends Task {
  description: string
  checklist: ChecklistItem[]
  activity: ActivityItem[]
}

export const DEFAULT_LABELS: Label[] = [
  { id: "label-devops", name: "DevOps", color: "#64748b" },
  { id: "label-frontend", name: "Frontend", color: "#8b5cf6" },
  { id: "label-backend", name: "Backend", color: "#06b6d4" },
  { id: "label-design", name: "Design", color: "#f59e0b" },
  { id: "label-bug", name: "Bug", color: "#ef4444" },
]
