import { Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Board } from "@/types/kanban"
import { palette } from "@/lib/theme"

export function BoardCard({ board, onPress }: { board: Board; onPress: () => void }) {
  const taskCount = board.data.lists.reduce((sum, list) => sum + list.tasks.length, 0)

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.colorBar, { backgroundColor: board.color }]} />
      <View style={styles.body}>
        <Text style={styles.title}>{board.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {board.description || "No description"}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="albums-outline" size={14} color={palette.textMuted} />
            <Text style={styles.metaText}>{board.data.lists.length} lists</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="checkbox-outline" size={14} color={palette.textMuted} />
            <Text style={styles.metaText}>{taskCount} tasks</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
  },
  colorBar: {
    height: 10,
  },
  body: {
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.text,
  },
  description: {
    color: palette.textMuted,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
})
