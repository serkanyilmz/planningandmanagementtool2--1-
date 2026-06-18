import { useEffect, useMemo, useState } from "react"
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { suggestTask } from "@/api/ai"
import { todayInputValue } from "@/lib/dates"
import { palette } from "@/lib/theme"
import { useAuth } from "@/providers/auth-provider"
import type { Board, KanbanList, Task } from "@/types/kanban"
import type { TaskSuggestionResponse } from "@/types/ai"

interface TaskEditorModalProps {
  visible: boolean
  board: Board
  list: KanbanList
  task?: Task | null
  onClose: () => void
  onCreate: (payload: Omit<Task, "id">) => Promise<void>
  onSave: (taskId: string, payload: Partial<Task>) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  onMove?: (taskId: string, targetListId: string) => Promise<void>
}

const PRIORITIES: Array<Task["priority"]> = ["high", "medium", "low"]
const REMINDERS: Array<NonNullable<Task["reminderBefore"]>> = ["none", "1_day", "2_hours", "1_hour"]

export function TaskEditorModal({
  visible,
  board,
  list,
  task,
  onClose,
  onCreate,
  onSave,
  onDelete,
  onMove,
}: TaskEditorModalProps) {
  const { token } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState(todayInputValue())
  const [priority, setPriority] = useState<Task["priority"]>("medium")
  const [reminderBefore, setReminderBefore] = useState<NonNullable<Task["reminderBefore"]>>("none")
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")
  const [moveTargetListId, setMoveTargetListId] = useState(list.id)

  useEffect(() => {
    if (!visible) return
    setTitle(task?.title || "")
    setDescription(task?.description || "")
    setDueDate(task?.dueDate || todayInputValue())
    setPriority(task?.priority || "medium")
    setReminderBefore(task?.reminderBefore || "none")
    setSelectedLabelIds(task?.labels.map((label) => label.id) || [])
    setSelectedAssigneeIds(task?.assignees.map((assignee) => assignee.id) || [])
    setMoveTargetListId(list.id)
    setAiError("")
  }, [list.id, task, visible])

  const selectedLabels = useMemo(
    () => board.labels.filter((label) => selectedLabelIds.includes(label.id)),
    [board.labels, selectedLabelIds],
  )

  const selectedAssignees = useMemo(
    () => (board.members || []).filter((member) => selectedAssigneeIds.includes(member.id)),
    [board.members, selectedAssigneeIds],
  )

  const submitPayload = {
    title,
    description,
    dueDate,
    priority,
    labels: selectedLabels,
    assignees: selectedAssignees.map(({ id, name, avatar }) => ({ id, name, avatar })),
    reminderBefore,
    attachments: task?.attachments || [],
    boardId: board.id,
    boardKey: board.boardKey,
    taskKey: task?.taskKey,
  } satisfies Partial<Task>

  const handleAiSuggest = async () => {
    if (!token) {
      setAiError("Sign in to use AI.")
      return
    }

    setAiLoading(true)
    setAiError("")
    try {
      const response = await suggestTask(token, {
        title,
        description,
        dueDate,
        priority,
        boardId: board.id,
        boardKey: board.boardKey,
        listId: list.id,
        boardTitle: board.title,
        listTitle: list.title,
        taskId: task?.id,
        taskKey: task?.taskKey,
        availableLabels: board.labels.map((label) => label.name),
      })

      applySuggestion(response)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI suggestion failed")
    } finally {
      setAiLoading(false)
    }
  }

  const applySuggestion = (response: TaskSuggestionResponse) => {
    setTitle(response.suggestedTitle || title)
    setDescription(
      [response.suggestedDescription, ...response.acceptanceCriteria.map((item) => `- ${item}`)]
        .filter(Boolean)
        .join("\n"),
    )
    setPriority(response.suggestedPriority)
    setReminderBefore(response.suggestedReminder)
    setSelectedLabelIds(
      board.labels.filter((label) => response.suggestedLabels.includes(label.name)).map((label) => label.id),
    )
  }

  const handleSubmit = async () => {
    if (!title.trim()) return

    if (task) {
      await onSave(task.id, submitPayload)
    } else {
      await onCreate(submitPayload as Omit<Task, "id">)
    }

    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{task ? task.taskKey || "Edit Task" : "New Task"}</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.link}>Close</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.multiline]}
            multiline
          />
          <TextInput placeholder="Due date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} style={styles.input} />

          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.row}>
            {PRIORITIES.map((item) => (
              <ChipButton key={item} label={item} active={priority === item} onPress={() => setPriority(item)} />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Reminder</Text>
          <View style={styles.row}>
            {REMINDERS.map((item) => (
              <ChipButton key={item} label={item} active={reminderBefore === item} onPress={() => setReminderBefore(item)} />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Labels</Text>
          <View style={styles.row}>
            {board.labels.map((label) => (
              <ChipButton
                key={label.id}
                label={label.name}
                active={selectedLabelIds.includes(label.id)}
                onPress={() =>
                  setSelectedLabelIds((prev) =>
                    prev.includes(label.id) ? prev.filter((id) => id !== label.id) : [...prev, label.id],
                  )
                }
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Assignees</Text>
          <View style={styles.row}>
            {(board.members || []).map((member) => (
              <ChipButton
                key={member.id}
                label={member.name}
                active={selectedAssigneeIds.includes(member.id)}
                onPress={() =>
                  setSelectedAssigneeIds((prev) =>
                    prev.includes(member.id) ? prev.filter((id) => id !== member.id) : [...prev, member.id],
                  )
                }
              />
            ))}
          </View>

          {task && board.data.lists.length > 1 && onMove && (
            <>
              <Text style={styles.sectionTitle}>Move To</Text>
              <View style={styles.row}>
                {board.data.lists.map((item) => (
                  <ChipButton
                    key={item.id}
                    label={item.title}
                    active={moveTargetListId === item.id}
                    onPress={() => setMoveTargetListId(item.id)}
                  />
                ))}
              </View>
              {moveTargetListId !== list.id && (
                <Pressable style={[styles.secondaryButton, styles.actionSpacing]} onPress={() => onMove(task.id, moveTargetListId).then(onClose)}>
                  <Text style={styles.secondaryButtonText}>Move Task</Text>
                </Pressable>
              )}
            </>
          )}

          <Pressable style={styles.secondaryButton} onPress={handleAiSuggest}>
            <Text style={styles.secondaryButtonText}>{aiLoading ? "Thinking..." : "AI Suggest"}</Text>
          </Pressable>
          {!!aiError && <Text style={styles.error}>{aiError}</Text>}
        </ScrollView>
        <View style={styles.footer}>
          {task && onDelete ? (
            <Pressable style={styles.deleteButton} onPress={() => onDelete(task.id).then(onClose)}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>{task ? "Save" : "Create"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function ChipButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surfaceMuted,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
  },
  link: {
    color: palette.primary,
    fontWeight: "700",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.text,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  sectionTitle: {
    color: palette.text,
    fontWeight: "700",
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: palette.primarySoft,
    borderColor: "#93c5fd",
  },
  chipText: {
    color: palette.textMuted,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  chipTextActive: {
    color: palette.primary,
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: palette.text,
    fontWeight: "700",
  },
  actionSpacing: {
    marginTop: 8,
  },
  error: {
    color: palette.danger,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  deleteButtonText: {
    color: palette.danger,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
})
