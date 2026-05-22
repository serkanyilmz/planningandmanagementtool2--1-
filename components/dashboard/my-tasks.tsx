import { TaskItem } from "./task-item"

const tasks = [
  {
    title: "Review design mockups for homepage",
    board: "Website Redesign",
    dueDate: "Jan 3",
    priority: "High" as const,
    assignee: { name: "John Doe", initials: "JD" },
  },
  {
    title: "Prepare Q1 marketing presentation",
    board: "Marketing Campaign Q1",
    dueDate: "Jan 5",
    priority: "High" as const,
    assignee: { name: "John Doe", initials: "JD" },
  },
  {
    title: "Update API documentation",
    board: "Product Roadmap 2025",
    dueDate: "Jan 8",
    priority: "Medium" as const,
    assignee: { name: "John Doe", initials: "JD" },
  },
  {
    title: "Conduct user interview sessions",
    board: "Customer Research",
    dueDate: "Jan 10",
    priority: "Medium" as const,
    assignee: { name: "John Doe", initials: "JD" },
  },
  {
    title: "Fix mobile navigation bug",
    board: "Mobile App Development",
    dueDate: "Jan 15",
    priority: "Low" as const,
    assignee: { name: "John Doe", initials: "JD" },
  },
]

export function MyTasks() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">My Tasks</h2>
        <a href="#" className="text-sm font-medium text-primary hover:underline">
          View all
        </a>
      </div>
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <TaskItem key={index} {...task} />
        ))}
      </div>
    </section>
  )
}
