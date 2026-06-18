export function formatDateLabel(value?: string) {
  if (!value) return "No due date"
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}
