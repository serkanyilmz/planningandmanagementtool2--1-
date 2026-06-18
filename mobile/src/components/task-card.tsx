import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { formatDateLabel } from "@/lib/dates"
import { palette } from "@/lib/theme"
import { useAuth } from "@/providers/auth-provider"
import { protectedImageSource } from "@/api/client"
import type { Task } from "@/types/kanban"

export function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const { token } = useAuth()
  const cover = task.attachments.find((attachment) => attachment.cover) || task.attachments[0]

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {cover && <Image source={protectedImageSource(cover.url, token)} style={styles.cover} />}
      <View style={styles.body}>
        {!!task.taskKey && <Text style={styles.key}>{task.taskKey}</Text>}
        <Text style={styles.title}>{task.title}</Text>
        {!!task.description && (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        )}
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Ionicons name="flag-outline" size={13} color={palette.textMuted} />
            <Text style={styles.badgeText}>{task.priority}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="calendar-outline" size={13} color={palette.textMuted} />
            <Text style={styles.badgeText}>{formatDateLabel(task.dueDate)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: 120,
  },
  body: {
    padding: 14,
    gap: 8,
  },
  key: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
  },
  description: {
    color: palette.textMuted,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
})
