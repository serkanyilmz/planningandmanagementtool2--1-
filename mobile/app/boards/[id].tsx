import { useMemo, useState } from "react"
import { useLocalSearchParams } from "expo-router"
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { chatWithBoard, draftTasks, summarizeBoard } from "@/api/ai"
import { Screen } from "@/components/screen"
import { TaskCard } from "@/components/task-card"
import { TaskEditorModal } from "@/components/task-editor-modal"
import { formatDateLabel, todayInputValue } from "@/lib/dates"
import { palette } from "@/lib/theme"
import { useAuth } from "@/providers/auth-provider"
import { useBoards } from "@/providers/boards-provider"
import type { BoardSummaryResponse } from "@/types/ai"
import type { Task } from "@/types/kanban"

export default function BoardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { token } = useAuth()
  const { getBoardById, addTask, updateTask, deleteTask, moveTask, refreshBoards } = useBoards()

  const board = getBoardById(id)
  const [selectedListId, setSelectedListId] = useState(board?.data.lists[0]?.id || "")
  const [editorVisible, setEditorVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [summary, setSummary] = useState<BoardSummaryResponse | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [draftGoal, setDraftGoal] = useState("Deliver the next useful slice for this board.")
  const [chatMessage, setChatMessage] = useState("")
  const [chatAnswer, setChatAnswer] = useState("")

  const selectedList = useMemo(() => board?.data.lists.find((list) => list.id === selectedListId) || board?.data.lists[0], [board, selectedListId])

  if (!board) {
    return (
      <Screen>
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      </Screen>
    )
  }

  const handleCreateTask = async (payload: Omit<Task, "id">) => {
    if (!selectedList) return
    await addTask(selectedList.id, payload)
    await refreshBoards()
  }

  const handleSaveTask = async (taskId: string, payload: Partial<Task>) => {
    await updateTask(taskId, payload)
    await refreshBoards()
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId)
    await refreshBoards()
  }

  const handleMoveTask = async (taskId: string, targetListId: string) => {
    await moveTask(taskId, targetListId)
    setSelectedListId(targetListId)
    await refreshBoards()
  }

  const handleLoadSummary = async () => {
    if (!token) return
    setSummaryLoading(true)
    try {
      const response = await summarizeBoard(token, board.id)
      setSummary(response)
    } catch (error) {
      Alert.alert("AI summary failed", error instanceof Error ? error.message : "Please try again.")
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleDraftTasks = async () => {
    if (!token || !selectedList) return
    try {
      const response = await draftTasks(token, board.id, draftGoal || "Create the next tasks", selectedList.id)
      if (response.tasks.length === 0) {
        Alert.alert("No draft tasks", "AI did not return any task drafts this time.")
        return
      }

      for (const item of response.tasks) {
        await addTask(selectedList.id, {
          title: item.title,
          description: [item.description, ...item.acceptanceCriteria.map((line) => `- ${line}`)].join("\n"),
          labels: board.labels.filter((label) => item.suggestedLabels.includes(label.name)),
          priority: item.priority,
          dueDate: item.dueDate || todayInputValue(),
          assignees: [],
          reminderBefore: "none",
          attachments: [],
          boardId: board.id,
          boardKey: board.boardKey,
        })
      }

      await refreshBoards()
      Alert.alert("Draft tasks created", `${response.tasks.length} tasks added to ${selectedList.title}.`)
    } catch (error) {
      Alert.alert("Draft failed", error instanceof Error ? error.message : "Please try again.")
    }
  }

  const handleAskAi = async () => {
    if (!token || !chatMessage.trim()) return
    try {
      const response = await chatWithBoard(token, board.id, chatMessage.trim())
      setChatAnswer(
        [response.answer, ...response.suggestedActions.map((action) => `- ${action}`), ...response.actionCards.map((item) => `* ${item}`)]
          .filter(Boolean)
          .join("\n"),
      )
    } catch (error) {
      Alert.alert("Ask AI failed", error instanceof Error ? error.message : "Please try again.")
    }
  }

  return (
    <>
      <Screen scroll>
        <View style={styles.hero}>
          <View style={[styles.colorPill, { backgroundColor: board.color }]} />
          <Text style={styles.title}>{board.title}</Text>
          {!!board.boardKey && <Text style={styles.key}>{board.boardKey}</Text>}
          <Text style={styles.copy}>{board.description || "No description"}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {board.data.lists.map((list) => (
            <Pressable
              key={list.id}
              onPress={() => setSelectedListId(list.id)}
              style={[styles.tab, selectedList?.id === list.id && styles.tabActive]}
            >
              <Text style={[styles.tabText, selectedList?.id === list.id && styles.tabTextActive]}>
                {list.title} ({list.tasks.length})
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{selectedList?.title || "Tasks"}</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              setSelectedTask(null)
              setEditorVisible(true)
            }}
          >
            <Text style={styles.primaryButtonText}>Add task</Text>
          </Pressable>
        </View>

        <View style={styles.stack}>
          {(selectedList?.tasks || []).map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => {
                setSelectedTask(task)
                setEditorVisible(true)
              }}
            />
          ))}
          {(selectedList?.tasks.length || 0) === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No tasks in this column</Text>
              <Text style={styles.emptyCopy}>Use the Add task button or let AI draft the next useful steps.</Text>
            </View>
          )}
        </View>

        <View style={styles.aiCard}>
          <Text style={styles.sectionTitle}>Board AI</Text>
          <View style={styles.aiActions}>
            <Pressable style={styles.secondaryButton} onPress={handleLoadSummary}>
              <Text style={styles.secondaryButtonText}>{summaryLoading ? "Loading..." : "Board Summary"}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleDraftTasks}>
              <Text style={styles.secondaryButtonText}>Smart Draft</Text>
            </Pressable>
          </View>
          <TextInput value={draftGoal} onChangeText={setDraftGoal} style={[styles.input, styles.multilineSmall]} multiline />
          {summary && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>{summary.riskLevel} risk · {summary.healthScore}/100</Text>
              <Text style={styles.summaryText}>{summary.summary}</Text>
              {summary.dailyFocus.map((item) => (
                <Text key={item} style={styles.bullet}>• {item}</Text>
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Ask AI</Text>
          <TextInput
            placeholder="Ask for guidance, blockers, or next steps"
            value={chatMessage}
            onChangeText={setChatMessage}
            style={[styles.input, styles.multilineSmall]}
            multiline
          />
          <Pressable style={styles.secondaryButton} onPress={handleAskAi}>
            <Text style={styles.secondaryButtonText}>Ask AI</Text>
          </Pressable>
          {!!chatAnswer && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{chatAnswer}</Text>
            </View>
          )}
        </View>
      </Screen>

      {selectedList && (
        <TaskEditorModal
          visible={editorVisible}
          board={board}
          list={selectedList}
          task={selectedTask}
          onClose={() => setEditorVisible(false)}
          onCreate={handleCreateTask}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onMove={handleMoveTask}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
    marginBottom: 14,
    gap: 8,
  },
  colorPill: {
    width: 52,
    height: 10,
    borderRadius: 999,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: "800",
  },
  key: {
    color: palette.primary,
    fontWeight: "700",
  },
  copy: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  tabRow: {
    gap: 8,
    paddingBottom: 6,
    marginBottom: 12,
  },
  tab: {
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: palette.primarySoft,
    borderColor: "#93c5fd",
  },
  tabText: {
    color: palette.textMuted,
    fontWeight: "700",
  },
  tabTextActive: {
    color: palette.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
  },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  stack: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emptyTitle: {
    color: palette.text,
    fontWeight: "700",
    fontSize: 17,
  },
  emptyCopy: {
    color: palette.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  aiCard: {
    marginTop: 16,
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  aiActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: palette.text,
    fontWeight: "700",
  },
  input: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineSmall: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  summaryBox: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  summaryTitle: {
    color: palette.text,
    fontWeight: "800",
  },
  summaryText: {
    color: palette.textMuted,
    lineHeight: 20,
  },
  bullet: {
    color: palette.textMuted,
    lineHeight: 20,
  },
})
