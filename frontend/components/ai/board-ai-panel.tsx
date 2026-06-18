"use client"

import { useState } from "react"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { AutoFixHigh, ExpandMore, Send, TipsAndUpdates } from "@mui/icons-material"
import { useAuth } from "@/contexts/auth-context"
import {
  chatWithBoard,
  draftTasks,
  summarizeBoard,
  type BoardChatResponse,
  type BoardSummaryResponse,
  type SmartTaskDraft,
} from "@/lib/ai-client"
import type { Label, List as KanbanList, Task } from "@/types/kanban"

interface EditableDraft extends SmartTaskDraft {
  selected: boolean
}

interface BoardAiPanelProps {
  boardId: string
  lists: KanbanList[]
  boardLabels: Label[]
  onAddTask: (listId: string, task: Omit<Task, "id">) => void
}

function dueDateOrToday(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split("T")[0]
  }
  return parsed.toISOString().split("T")[0]
}

function labelsFromNames(boardLabels: Label[], labelNames: string[]) {
  const normalizedNames = labelNames.map((name) => name.toLowerCase())
  return boardLabels.filter((label) => normalizedNames.includes(label.name.toLowerCase()))
}

function draftDescription(draft: EditableDraft) {
  return [
    draft.description,
    draft.acceptanceCriteria.length > 0
      ? `Acceptance criteria:\n${draft.acceptanceCriteria.map((item) => `- ${item}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n")
}

export function BoardAiPanel({ boardId, lists, boardLabels, onAddTask }: BoardAiPanelProps) {
  const { token } = useAuth()
  const [summary, setSummary] = useState<BoardSummaryResponse | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState("")

  const [goal, setGoal] = useState("")
  const [targetListId, setTargetListId] = useState(lists[0]?.id || "")
  const [drafts, setDrafts] = useState<EditableDraft[]>([])
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState("")

  const [chatMessage, setChatMessage] = useState("")
  const [chatResponse, setChatResponse] = useState<BoardChatResponse | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState("")

  const requireToken = () => {
    if (token) return token
    throw new Error("Sign in to use AI.")
  }

  const loadSummary = async () => {
    setSummaryLoading(true)
    setSummaryError("")
    try {
      setSummary(await summarizeBoard(requireToken(), boardId))
    } catch {
      setSummaryError("Board summary could not be loaded.")
    } finally {
      setSummaryLoading(false)
    }
  }

  const createDrafts = async () => {
    setDraftLoading(true)
    setDraftError("")
    try {
      const response = await draftTasks(requireToken(), boardId, goal, targetListId)
      setDrafts(response.tasks.map((task) => ({ ...task, selected: true })))
    } catch {
      setDraftError("Task drafts could not be created.")
    } finally {
      setDraftLoading(false)
    }
  }

  const updateDraft = (index: number, updates: Partial<EditableDraft>) => {
    setDrafts((prev) => prev.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...updates } : draft)))
  }

  const addDraftsToBoard = () => {
    drafts
      .filter((draft) => draft.selected)
      .forEach((draft) => {
        onAddTask(targetListId, {
          title: draft.title,
          description: draftDescription(draft),
          labels: labelsFromNames(boardLabels, draft.suggestedLabels),
          priority: draft.priority,
          dueDate: dueDateOrToday(draft.dueDate),
          assignees: [],
          reminderBefore: "none",
        })
      })
    setGoal("")
    setDrafts([])
  }

  const sendChat = async () => {
    setChatLoading(true)
    setChatError("")
    try {
      setChatResponse(await chatWithBoard(requireToken(), boardId, chatMessage))
    } catch {
      setChatError("AI chat response could not be loaded.")
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <Accordion disableGutters sx={{ mb: 2, border: 1, borderColor: "divider", boxShadow: "none" }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TipsAndUpdates color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            AI Workspace
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
              <Button
                variant="contained"
                startIcon={summaryLoading ? <CircularProgress size={16} color="inherit" /> : <AutoFixHigh />}
                onClick={loadSummary}
                disabled={summaryLoading}
              >
                Board Summary
              </Button>
              {summary && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    size="small"
                    color={summary.healthScore >= 80 ? "success" : summary.healthScore >= 55 ? "warning" : "error"}
                    label={`Health ${summary.healthScore}/100`}
                  />
                  <Chip
                    size="small"
                    color={summary.riskLevel === "Low" ? "success" : summary.riskLevel === "Medium" ? "warning" : "error"}
                    label={`${summary.riskLevel} risk`}
                  />
                  <Chip size="small" label={`${summary.totalTasks} tasks`} />
                  <Chip size="small" color={summary.overdueTasks ? "error" : "default"} label={`${summary.overdueTasks} overdue`} />
                  <Chip size="small" color={summary.highPriorityTasks ? "warning" : "default"} label={`${summary.highPriorityTasks} high`} />
                </Stack>
              )}
            </Stack>
            {summaryError && <Alert severity="error" sx={{ mt: 1.5 }}>{summaryError}</Alert>}
            {summary && (
              <Alert severity={summary.aiGenerated ? "success" : "info"} sx={{ mt: 1.5 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {summary.summary}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Daily Focus
                </Typography>
                <List dense disablePadding>
                  {summary.dailyFocus.map((item) => (
                    <ListItem key={item} disableGutters>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
                {(summary.blockedTasks.length > 0 || summary.weakTasks.length > 0 || summary.unassignedTasks.length > 0) && (
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {summary.blockedTasks.length > 0 && (
                      <Typography variant="caption">Blocked-looking: {summary.blockedTasks.join(", ")}</Typography>
                    )}
                    {summary.weakTasks.length > 0 && (
                      <Typography variant="caption">Needs clearer description: {summary.weakTasks.join(", ")}</Typography>
                    )}
                    {summary.unassignedTasks.length > 0 && (
                      <Typography variant="caption">Unassigned: {summary.unassignedTasks.join(", ")}</Typography>
                    )}
                  </Stack>
                )}
              </Alert>
            )}
          </Box>

          <Divider />

          <Box>
            <Stack spacing={1.5}>
              <TextField
                label="Goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel>Target List</InputLabel>
                  <Select
                    value={targetListId}
                    onChange={(event) => setTargetListId(event.target.value)}
                    input={<OutlinedInput label="Target List" />}
                  >
                    {lists.map((list) => (
                      <MenuItem key={list.id} value={list.id}>
                        {list.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={draftLoading ? <CircularProgress size={16} /> : <AutoFixHigh />}
                  onClick={createDrafts}
                  disabled={!goal.trim() || !targetListId || draftLoading}
                >
                  Draft Tasks
                </Button>
              </Stack>
              {draftError && <Alert severity="error">{draftError}</Alert>}
              {drafts.length > 0 && (
                <Alert
                  severity="info"
                  action={
                    <Button color="inherit" size="small" onClick={addDraftsToBoard}>
                      Add Selected
                    </Button>
                  }
                >
                  <Stack spacing={1.5}>
                    {drafts.map((draft, index) => (
                      <Box
                        key={`${draft.title}-${draft.dueDate}-${index}`}
                        sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5, bgcolor: "background.paper" }}
                      >
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <Checkbox
                            checked={draft.selected}
                            onChange={(event) => updateDraft(index, { selected: event.target.checked })}
                            sx={{ p: 0.5 }}
                          />
                          <Stack spacing={1} sx={{ flex: 1 }}>
                            <TextField
                              label="Title"
                              size="small"
                              value={draft.title}
                              onChange={(event) => updateDraft(index, { title: event.target.value })}
                              fullWidth
                            />
                            <TextField
                              label="Description"
                              size="small"
                              value={draft.description}
                              onChange={(event) => updateDraft(index, { description: event.target.value })}
                              fullWidth
                              multiline
                              minRows={2}
                            />
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                  value={draft.priority}
                                  onChange={(event) =>
                                    updateDraft(index, { priority: event.target.value as SmartTaskDraft["priority"] })
                                  }
                                  input={<OutlinedInput label="Priority" />}
                                >
                                  <MenuItem value="high">High</MenuItem>
                                  <MenuItem value="medium">Medium</MenuItem>
                                  <MenuItem value="low">Low</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                label="Due Date"
                                size="small"
                                type="date"
                                value={dueDateOrToday(draft.dueDate)}
                                onChange={(event) => updateDraft(index, { dueDate: event.target.value })}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Stack>
                            {draft.acceptanceCriteria.length > 0 && (
                              <Typography variant="caption">
                                Acceptance: {draft.acceptanceCriteria.join("; ")}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Alert>
              )}
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                label="Ask AI"
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={chatLoading ? <CircularProgress size={16} /> : <Send />}
                onClick={sendChat}
                disabled={!chatMessage.trim() || chatLoading}
              >
                Send
              </Button>
            </Stack>
            {chatError && <Alert severity="error" sx={{ mt: 1.5 }}>{chatError}</Alert>}
            {chatResponse && (
              <Alert severity={chatResponse.aiGenerated ? "success" : "info"} sx={{ mt: 1.5 }}>
                <Stack spacing={1}>
                  <Typography variant="body2">{chatResponse.answer}</Typography>
                  {chatResponse.actionCards.length > 0 && (
                    <Stack spacing={0.75}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        Recommended Actions
                      </Typography>
                      {chatResponse.actionCards.map((action) => (
                        <Box
                          key={action}
                          sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1 }}
                        >
                          <Typography variant="caption">{action}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Alert>
            )}
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}
