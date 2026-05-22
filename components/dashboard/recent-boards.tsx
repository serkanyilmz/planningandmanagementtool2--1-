import { BoardCard } from "./board-card"

const boards = [
  { title: "Marketing Campaign Q1", color: "#1e3a5f", tasksCount: 24, membersCount: 5 },
  { title: "Product Roadmap 2025", color: "#0d9488", tasksCount: 18, membersCount: 8 },
  { title: "Website Redesign", color: "#7c3aed", tasksCount: 32, membersCount: 4 },
  { title: "Mobile App Development", color: "#ea580c", tasksCount: 45, membersCount: 6 },
  { title: "Customer Research", color: "#0891b2", tasksCount: 12, membersCount: 3 },
  { title: "Sales Pipeline", color: "#16a34a", tasksCount: 28, membersCount: 7 },
]

export function RecentBoards() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Recent Boards</h2>
        <a href="#" className="text-sm font-medium text-primary hover:underline">
          View all
        </a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => (
          <BoardCard key={board.title} {...board} />
        ))}
      </div>
    </section>
  )
}
