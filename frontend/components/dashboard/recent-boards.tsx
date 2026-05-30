import { BoardCard } from "./board-card"

const boards = [
  { id: "sample-marketing", title: "Marketing Campaign Q1", color: "#1e3a5f", listCount: 4, taskCount: 24, membersCount: 5 },
  { id: "sample-roadmap", title: "Product Roadmap 2025", color: "#0d9488", listCount: 5, taskCount: 18, membersCount: 8 },
  { id: "sample-redesign", title: "Website Redesign", color: "#7c3aed", listCount: 4, taskCount: 32, membersCount: 4 },
  { id: "sample-mobile", title: "Mobile App Development", color: "#ea580c", listCount: 5, taskCount: 45, membersCount: 6 },
  { id: "sample-research", title: "Customer Research", color: "#0891b2", listCount: 3, taskCount: 12, membersCount: 3 },
  { id: "sample-sales", title: "Sales Pipeline", color: "#16a34a", listCount: 4, taskCount: 28, membersCount: 7 },
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
