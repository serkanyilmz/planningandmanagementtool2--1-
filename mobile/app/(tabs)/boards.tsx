import { useState } from "react"
import { router } from "expo-router"
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { BoardCard } from "@/components/board-card"
import { Screen } from "@/components/screen"
import { palette } from "@/lib/theme"
import { useBoards } from "@/providers/boards-provider"

const BOARD_COLORS = ["#002366", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"]

export default function BoardsScreen() {
  const { boards, loading, refreshing, refreshBoards, createBoard } = useBoards()
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(BOARD_COLORS[0])

  const handleCreateBoard = async () => {
    const board = await createBoard({ title, description, color })
    if (!board) {
      Alert.alert("Board not created", "Please sign in again and retry.")
      return
    }
    setModalOpen(false)
    setTitle("")
    setDescription("")
    setColor(BOARD_COLORS[0])
    router.push(`/boards/${board.id}`)
  }

  return (
    <>
      <Screen>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Boards</Text>
            <Text style={styles.copy}>Quick access to your planning space, now shaped for mobile.</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => setModalOpen(true)}>
            <Text style={styles.primaryButtonText}>New</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refreshBoards()} />}
            contentContainerStyle={styles.list}
          >
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} onPress={() => router.push(`/boards/${board.id}`)} />
            ))}
            {boards.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No boards yet</Text>
                <Text style={styles.emptyCopy}>Create your first board to start building the mobile workflow.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </Screen>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create board</Text>
            <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
            <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={[styles.input, styles.multiline]} multiline />
            <View style={styles.colorRow}>
              {BOARD_COLORS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setColor(item)}
                  style={[styles.colorDot, { backgroundColor: item }, color === item && styles.colorDotActive]}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setModalOpen(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonLarge} onPress={() => void handleCreateBoard()}>
                <Text style={styles.primaryButtonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: palette.text,
  },
  copy: {
    marginTop: 6,
    color: palette.textMuted,
    maxWidth: 260,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonLarge: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flex: 1,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  emptyState: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    marginTop: 12,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyCopy: {
    color: palette.textMuted,
    marginTop: 8,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    color: palette.text,
    fontWeight: "800",
    fontSize: 20,
  },
  input: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotActive: {
    borderColor: palette.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: palette.text,
    fontWeight: "700",
  },
})
