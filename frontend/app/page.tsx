import type { BoardData } from "@/types/kanban"
import { redirect } from "next/navigation"

const sampleBoardData: BoardData = {
  lists: [
    {
      id: "1",
      title: "Backlog",
      tasks: [
        {
          id: "t1",
          title: "Research competitor pricing models",
          labels: [{ id: "l1", name: "Research", color: "#6366f1" }],
          priority: "low",
          dueDate: "2025-01-15",
          assignees: [{ id: "a1", name: "Sarah Chen", avatar: "/professional-woman.png" }],
        },
        {
          id: "t2",
          title: "Update user documentation for v2.0",
          labels: [{ id: "l2", name: "Docs", color: "#10b981" }],
          priority: "medium",
          dueDate: "2025-01-20",
          assignees: [{ id: "a2", name: "Mike Ross", avatar: "/professional-man.png" }],
        },
      ],
    },
    {
      id: "2",
      title: "To Do",
      tasks: [
        {
          id: "t3",
          title: "Design new onboarding flow",
          labels: [
            { id: "l3", name: "Design", color: "#f59e0b" },
            { id: "l4", name: "UX", color: "#ec4899" },
          ],
          priority: "high",
          dueDate: "2025-01-08",
          assignees: [
            { id: "a3", name: "Emma Wilson", avatar: "/woman-designer.png" },
            { id: "a1", name: "Sarah Chen", avatar: "/professional-woman.png" },
          ],
        },
        {
          id: "t4",
          title: "Implement SSO authentication",
          labels: [
            { id: "l5", name: "Backend", color: "#3b82f6" },
            { id: "l6", name: "Security", color: "#ef4444" },
          ],
          priority: "high",
          dueDate: "2025-01-10",
          assignees: [{ id: "a4", name: "James Liu", avatar: "/man-developer.png" }],
        },
        {
          id: "t5",
          title: "Create email notification templates",
          labels: [{ id: "l2", name: "Docs", color: "#10b981" }],
          priority: "medium",
          dueDate: "2025-01-12",
          assignees: [{ id: "a2", name: "Mike Ross", avatar: "/professional-man.png" }],
        },
      ],
    },
    {
      id: "3",
      title: "In Progress",
      tasks: [
        {
          id: "t6",
          title: "Build dashboard analytics widgets",
          labels: [
            { id: "l7", name: "Frontend", color: "#8b5cf6" },
            { id: "l8", name: "Charts", color: "#06b6d4" },
          ],
          priority: "high",
          dueDate: "2025-01-05",
          assignees: [
            { id: "a1", name: "Sarah Chen", avatar: "/professional-woman.png" },
            { id: "a3", name: "Emma Wilson", avatar: "/woman-designer.png" },
            { id: "a4", name: "James Liu", avatar: "/man-developer.png" },
          ],
        },
        {
          id: "t7",
          title: "Optimize database queries for reports",
          labels: [{ id: "l5", name: "Backend", color: "#3b82f6" }],
          priority: "medium",
          dueDate: "2025-01-07",
          assignees: [{ id: "a4", name: "James Liu", avatar: "/man-developer.png" }],
        },
      ],
    },
    {
      id: "4",
      title: "Review",
      tasks: [
        {
          id: "t8",
          title: "Code review: Payment integration",
          labels: [
            { id: "l5", name: "Backend", color: "#3b82f6" },
            { id: "l6", name: "Security", color: "#ef4444" },
          ],
          priority: "high",
          dueDate: "2025-01-03",
          assignees: [{ id: "a2", name: "Mike Ross", avatar: "/professional-man.png" }],
        },
      ],
    },
    {
      id: "5",
      title: "Done",
      tasks: [
        {
          id: "t9",
          title: "Set up CI/CD pipeline",
          labels: [{ id: "l9", name: "DevOps", color: "#64748b" }],
          priority: "medium",
          dueDate: "2024-12-28",
          assignees: [{ id: "a4", name: "James Liu", avatar: "/man-developer.png" }],
        },
        {
          id: "t10",
          title: "Design system color palette",
          labels: [{ id: "l3", name: "Design", color: "#f59e0b" }],
          priority: "low",
          dueDate: "2024-12-25",
          assignees: [{ id: "a3", name: "Emma Wilson", avatar: "/woman-designer.png" }],
        },
      ],
    },
  ],
}

export default function RootPage() {
  redirect("/home")
}
