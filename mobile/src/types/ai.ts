export interface TaskSuggestionRequest {
  title: string
  description: string
  dueDate: string
  priority: "high" | "medium" | "low"
  boardId?: string
  boardKey?: string
  listId?: string
  boardTitle?: string
  listTitle?: string
  taskId?: string
  taskKey?: string
  availableLabels?: string[]
}

export interface TaskSuggestionResponse {
  suggestedTitle: string
  suggestedDescription: string
  suggestedPriority: "high" | "medium" | "low"
  deadlineRisk: "overdue" | "high" | "medium" | "normal"
  suggestedLabels: string[]
  acceptanceCriteria: string[]
  checklist: string[]
  estimatedEffort: string
  riskReason: string
  suggestedReminder: "1_day" | "2_hours" | "1_hour" | "none"
  suggestions: string[]
  aiGenerated: boolean
}

export interface BoardSummaryResponse {
  summary: string
  dailyFocus: string[]
  risks: string[]
  suggestedActions: string[]
  healthScore: number
  riskLevel: "Low" | "Medium" | "High"
  blockedTasks: string[]
  weakTasks: string[]
  unassignedTasks: string[]
  totalTasks: number
  overdueTasks: number
  highPriorityTasks: number
  aiGenerated: boolean
}

export interface SmartTaskDraft {
  title: string
  description: string
  priority: "high" | "medium" | "low"
  dueDate: string
  suggestedLabels: string[]
  acceptanceCriteria: string[]
}

export interface SmartTaskDraftResponse {
  tasks: SmartTaskDraft[]
  aiGenerated: boolean
}

export interface BoardChatResponse {
  answer: string
  referencedTasks: string[]
  suggestedActions: string[]
  actionCards: string[]
  aiGenerated: boolean
}
