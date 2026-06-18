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

export interface BoardMember extends Assignee {
  email: string
  role: "admin" | "member"
}

export interface TaskAttachment {
  id: string
  fileId: string
  fileName: string
  contentType: string
  sizeBytes: number
  url: string
  cover?: boolean
}

export interface Task {
  id: string
  taskKey?: string
  boardId?: string
  boardKey?: string
  title: string
  description?: string
  labels: Label[]
  priority: "high" | "medium" | "low"
  dueDate: string
  assignees: Assignee[]
  reminderBefore?: "1_day" | "2_hours" | "1_hour" | "none"
  attachments: TaskAttachment[]
}

export interface KanbanList {
  id: string
  title: string
  tasks: Task[]
}

export interface BoardData {
  lists: KanbanList[]
}

export interface Board {
  id: string
  boardKey?: string
  title: string
  description: string
  color: string
  memberIds: string[]
  members?: BoardMember[]
  currentUserRole?: "admin" | "member"
  data: BoardData
  labels: Label[]
}

export interface BoardReminder {
  id: string
  boardId: string
  boardTitle: string
  taskId: string
  taskTitle: string
  dueDate: string
  severity: "overdue" | "soon"
}
