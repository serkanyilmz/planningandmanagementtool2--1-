import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { palette } from "@/lib/theme"
import { useBoards } from "@/providers/boards-provider"

export function ReminderStrip() {
  const router = useRouter()
  const { reminders, dismissReminder } = useBoards()

  if (reminders.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      {reminders.map((reminder) => (
        <Pressable
          key={reminder.id}
          style={[styles.card, reminder.severity === "overdue" ? styles.overdue : styles.soon]}
          onPress={() => router.push(`/boards/${reminder.boardId}`)}
          onLongPress={() => dismissReminder(reminder.id)}
        >
          <Text style={styles.title}>{reminder.taskTitle}</Text>
          <Text style={styles.meta}>
            {reminder.boardTitle} · {reminder.severity === "overdue" ? "Overdue" : "Due within 24h"}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  overdue: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
  },
  soon: {
    backgroundColor: "#fef3c7",
    borderColor: "#fde68a",
  },
  title: {
    color: palette.text,
    fontWeight: "700",
  },
  meta: {
    color: palette.textMuted,
    marginTop: 4,
    fontSize: 12,
  },
})
