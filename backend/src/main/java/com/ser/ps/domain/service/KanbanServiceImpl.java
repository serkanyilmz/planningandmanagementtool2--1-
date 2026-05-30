package com.ser.ps.domain.service;

import com.ser.ps.application.dto.AddBoardMemberRequest;
import com.ser.ps.application.dto.AssigneeResponse;
import com.ser.ps.application.dto.BoardDataResponse;
import com.ser.ps.application.dto.BoardResponse;
import com.ser.ps.application.dto.CreateBoardRequest;
import com.ser.ps.application.dto.CreateLabelRequest;
import com.ser.ps.application.dto.CreateListRequest;
import com.ser.ps.application.dto.CreateTaskRequest;
import com.ser.ps.application.dto.KanbanListResponse;
import com.ser.ps.application.dto.LabelResponse;
import com.ser.ps.application.dto.MoveTaskRequest;
import com.ser.ps.application.dto.TaskResponse;
import com.ser.ps.application.dto.UpdateBoardRequest;
import com.ser.ps.application.dto.UpdateLabelRequest;
import com.ser.ps.application.dto.UpdateListRequest;
import com.ser.ps.application.dto.UpdateTaskRequest;
import com.ser.ps.application.ports.in.KanbanService;
import com.ser.ps.application.ports.out.BoardRepositoryPort;
import com.ser.ps.application.ports.out.KanbanListRepositoryPort;
import com.ser.ps.application.ports.out.LabelRepositoryPort;
import com.ser.ps.application.ports.out.TaskRepositoryPort;
import com.ser.ps.application.ports.out.UserRepositoryPort;
import com.ser.ps.domain.model.Board;
import com.ser.ps.domain.model.KanbanList;
import com.ser.ps.domain.model.Label;
import com.ser.ps.domain.model.ReminderBefore;
import com.ser.ps.domain.model.Task;
import com.ser.ps.domain.model.TaskPriority;
import com.ser.ps.domain.model.User;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public class KanbanServiceImpl implements KanbanService {

    private static final List<DefaultLabel> DEFAULT_LABELS = List.of(
            new DefaultLabel("DevOps", "#64748b"),
            new DefaultLabel("Frontend", "#8b5cf6"),
            new DefaultLabel("Backend", "#06b6d4"),
            new DefaultLabel("Design", "#f59e0b"),
            new DefaultLabel("Bug", "#ef4444")
    );

    private final BoardRepositoryPort boardRepositoryPort;
    private final KanbanListRepositoryPort listRepositoryPort;
    private final TaskRepositoryPort taskRepositoryPort;
    private final LabelRepositoryPort labelRepositoryPort;
    private final UserRepositoryPort userRepositoryPort;

    public KanbanServiceImpl(
            BoardRepositoryPort boardRepositoryPort,
            KanbanListRepositoryPort listRepositoryPort,
            TaskRepositoryPort taskRepositoryPort,
            LabelRepositoryPort labelRepositoryPort,
            UserRepositoryPort userRepositoryPort
    ) {
        this.boardRepositoryPort = boardRepositoryPort;
        this.listRepositoryPort = listRepositoryPort;
        this.taskRepositoryPort = taskRepositoryPort;
        this.labelRepositoryPort = labelRepositoryPort;
        this.userRepositoryPort = userRepositoryPort;
    }

    @Override
    public List<BoardResponse> getBoards(String username) {
        User user = currentUser(username);
        return boardRepositoryPort.findByMember(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public BoardResponse getBoard(Long boardId, String username) {
        return toResponse(boardForUser(boardId, username));
    }

    @Override
    public BoardResponse createBoard(CreateBoardRequest request, String username) {
        User user = currentUser(username);
        Board board = new Board(
                required(request.title(), "Board title is required"),
                defaultValue(request.description(), "New board description"),
                defaultValue(request.color(), "#002366"),
                user
        );

        int labelPosition = 0;
        for (DefaultLabel defaultLabel : DEFAULT_LABELS) {
            board.getLabels().add(new Label(defaultLabel.name(), defaultLabel.color(), board));
            labelPosition++;
        }

        board.getLists().add(new KanbanList("To Do", 0, board));
        board.getLists().add(new KanbanList("In Progress", 1, board));
        board.getLists().add(new KanbanList("Done", 2, board));

        return toResponse(boardRepositoryPort.save(board));
    }

    @Override
    public BoardResponse updateBoard(Long boardId, UpdateBoardRequest request, String username) {
        Board board = boardForUser(boardId, username);
        if (hasText(request.title())) {
            board.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            board.setDescription(request.description().trim());
        }
        if (hasText(request.color())) {
            board.setColor(request.color().trim());
        }
        return toResponse(boardRepositoryPort.save(board));
    }

    @Override
    public void deleteBoard(Long boardId, String username) {
        Board board = boardForUser(boardId, username);
        boardRepositoryPort.delete(board);
    }

    @Override
    public BoardResponse addMember(Long boardId, AddBoardMemberRequest request, String username) {
        Board board = boardForUser(boardId, username);
        User member = userRepositoryPort.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        board.getMembers().add(member);
        return toResponse(boardRepositoryPort.save(board));
    }

    @Override
    public BoardResponse addList(Long boardId, CreateListRequest request, String username) {
        Board board = boardForUser(boardId, username);
        KanbanList list = new KanbanList(required(request.title(), "List title is required"), board.getLists().size(), board);
        board.getLists().add(list);
        return toResponse(boardRepositoryPort.save(board));
    }

    @Override
    public BoardResponse updateList(Long listId, UpdateListRequest request, String username) {
        KanbanList list = listForUser(listId, username);
        list.setTitle(required(request.title(), "List title is required"));
        listRepositoryPort.save(list);
        return toResponse(list.getBoard());
    }

    @Override
    public BoardResponse deleteList(Long listId, String username) {
        KanbanList list = listForUser(listId, username);
        Board board = list.getBoard();
        board.getLists().remove(list);
        normalizeListPositions(board);
        return toResponse(boardRepositoryPort.save(board));
    }

    @Override
    public BoardResponse clearListTasks(Long listId, String username) {
        KanbanList list = listForUser(listId, username);
        list.getTasks().clear();
        listRepositoryPort.save(list);
        return toResponse(list.getBoard());
    }

    @Override
    public BoardResponse addTask(Long listId, CreateTaskRequest request, String username) {
        KanbanList list = listForUser(listId, username);
        Task task = new Task(
                required(request.title(), "Task title is required"),
                defaultValue(request.description(), ""),
                priorityFrom(request.priority()),
                dateFrom(request.dueDate()),
                reminderFrom(request.reminderBefore()),
                list.getTasks().size(),
                list
        );
        applyTaskRelations(task, list.getBoard(), request.labelIds(), request.assigneeIds());
        list.getTasks().add(task);
        listRepositoryPort.save(list);
        return toResponse(list.getBoard());
    }

    @Override
    public BoardResponse updateTask(Long taskId, UpdateTaskRequest request, String username) {
        Task task = taskForUser(taskId, username);
        task.setTitle(required(request.title(), "Task title is required"));
        task.setDescription(defaultValue(request.description(), ""));
        task.setPriority(priorityFrom(request.priority()));
        task.setDueDate(dateFrom(request.dueDate()));
        task.setReminderBefore(reminderFrom(request.reminderBefore()));
        applyTaskRelations(task, task.getList().getBoard(), request.labelIds(), request.assigneeIds());
        taskRepositoryPort.save(task);
        return toResponse(task.getList().getBoard());
    }

    @Override
    public BoardResponse deleteTask(Long taskId, String username) {
        Task task = taskForUser(taskId, username);
        KanbanList list = task.getList();
        list.getTasks().remove(task);
        normalizeTaskPositions(list);
        listRepositoryPort.save(list);
        return toResponse(list.getBoard());
    }

    @Override
    public BoardResponse moveTask(Long taskId, MoveTaskRequest request, String username) {
        Task task = taskForUser(taskId, username);
        KanbanList sourceList = task.getList();
        KanbanList targetList = listForUser(request.targetListId(), username);

        if (!sourceList.getBoard().getId().equals(targetList.getBoard().getId())) {
            throw new IllegalArgumentException("Task can only be moved inside the same board");
        }

        sourceList.getTasks().remove(task);
        normalizeTaskPositions(sourceList);
        task.setList(targetList);
        task.setPosition(targetList.getTasks().size());
        targetList.getTasks().add(task);

        listRepositoryPort.save(sourceList);
        listRepositoryPort.save(targetList);
        return toResponse(targetList.getBoard());
    }

    @Override
    public BoardResponse addLabel(Long boardId, CreateLabelRequest request, String username) {
        Board board = boardForUser(boardId, username);
        board.getLabels().add(new Label(required(request.name(), "Label name is required"), required(request.color(), "Label color is required"), board));
        return toResponse(boardRepositoryPort.save(board));
    }

    @Override
    public BoardResponse updateLabel(Long labelId, UpdateLabelRequest request, String username) {
        Label label = labelForUser(labelId, username);
        label.setName(required(request.name(), "Label name is required"));
        label.setColor(required(request.color(), "Label color is required"));
        labelRepositoryPort.save(label);
        return toResponse(label.getBoard());
    }

    @Override
    public BoardResponse deleteLabel(Long labelId, String username) {
        Label label = labelForUser(labelId, username);
        Board board = label.getBoard();
        for (KanbanList list : board.getLists()) {
            for (Task task : list.getTasks()) {
                task.getLabels().removeIf(existing -> existing.getId().equals(labelId));
            }
        }
        board.getLabels().remove(label);
        return toResponse(boardRepositoryPort.save(board));
    }

    private void applyTaskRelations(Task task, Board board, List<String> labelIds, List<String> assigneeIds) {
        Set<Long> labelIdSet = parseIds(labelIds);
        task.getLabels().clear();
        board.getLabels().stream()
                .filter(label -> labelIdSet.contains(label.getId()))
                .forEach(task.getLabels()::add);

        Set<Long> assigneeIdSet = parseIds(assigneeIds);
        task.getAssignees().clear();
        board.getMembers().stream()
                .filter(member -> assigneeIdSet.contains(member.getId()))
                .forEach(task.getAssignees()::add);
    }

    private Board boardForUser(Long boardId, String username) {
        Board board = boardRepositoryPort.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));
        User user = currentUser(username);
        if (!board.isMember(user)) {
            throw new IllegalArgumentException("You do not have access to this board");
        }
        return board;
    }

    private KanbanList listForUser(Long listId, String username) {
        KanbanList list = listRepositoryPort.findById(listId)
                .orElseThrow(() -> new IllegalArgumentException("List not found"));
        boardForUser(list.getBoard().getId(), username);
        return list;
    }

    private Task taskForUser(Long taskId, String username) {
        Task task = taskRepositoryPort.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        boardForUser(task.getList().getBoard().getId(), username);
        return task;
    }

    private Label labelForUser(Long labelId, String username) {
        Label label = labelRepositoryPort.findById(labelId)
                .orElseThrow(() -> new IllegalArgumentException("Label not found"));
        boardForUser(label.getBoard().getId(), username);
        return label;
    }

    private User currentUser(String username) {
        return userRepositoryPort.findByUsernameOrEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    }

    private BoardResponse toResponse(Board board) {
        List<KanbanListResponse> lists = board.getLists().stream()
                .sorted(Comparator.comparingInt(KanbanList::getPosition))
                .map(this::toResponse)
                .toList();

        List<String> memberIds = board.getMembers().stream()
                .map(member -> String.valueOf(member.getId()))
                .sorted()
                .toList();

        List<LabelResponse> labels = board.getLabels().stream()
                .sorted(Comparator.comparing(Label::getId))
                .map(this::toResponse)
                .toList();

        return new BoardResponse(
                String.valueOf(board.getId()),
                board.getTitle(),
                board.getDescription(),
                board.getColor(),
                memberIds,
                new BoardDataResponse(lists),
                labels
        );
    }

    private KanbanListResponse toResponse(KanbanList list) {
        return new KanbanListResponse(
                String.valueOf(list.getId()),
                list.getTitle(),
                list.getTasks().stream()
                        .sorted(Comparator.comparingInt(Task::getPosition))
                        .map(this::toResponse)
                        .toList()
        );
    }

    private TaskResponse toResponse(Task task) {
        return new TaskResponse(
                String.valueOf(task.getId()),
                task.getTitle(),
                task.getDescription(),
                task.getLabels().stream()
                        .sorted(Comparator.comparing(Label::getId))
                        .map(this::toResponse)
                        .toList(),
                task.getPriority().name().toLowerCase(Locale.ROOT),
                task.getDueDate() == null ? "" : task.getDueDate().toString(),
                task.getAssignees().stream()
                        .sorted(Comparator.comparing(User::getId))
                        .map(user -> new AssigneeResponse(String.valueOf(user.getId()), user.getFullName(), ""))
                        .toList(),
                reminderToClient(task.getReminderBefore())
        );
    }

    private LabelResponse toResponse(Label label) {
        return new LabelResponse(String.valueOf(label.getId()), label.getName(), label.getColor());
    }

    private void normalizeListPositions(Board board) {
        List<KanbanList> lists = board.getLists().stream()
                .sorted(Comparator.comparingInt(KanbanList::getPosition))
                .toList();
        for (int i = 0; i < lists.size(); i++) {
            lists.get(i).setPosition(i);
        }
    }

    private void normalizeTaskPositions(KanbanList list) {
        List<Task> tasks = list.getTasks().stream()
                .sorted(Comparator.comparingInt(Task::getPosition))
                .toList();
        for (int i = 0; i < tasks.size(); i++) {
            tasks.get(i).setPosition(i);
        }
    }

    private TaskPriority priorityFrom(String value) {
        if (!hasText(value)) {
            return TaskPriority.MEDIUM;
        }
        return TaskPriority.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }

    private ReminderBefore reminderFrom(String value) {
        if (!hasText(value) || "none".equalsIgnoreCase(value)) {
            return ReminderBefore.NONE;
        }
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "1_day" -> ReminderBefore.ONE_DAY;
            case "2_hours" -> ReminderBefore.TWO_HOURS;
            case "1_hour" -> ReminderBefore.ONE_HOUR;
            default -> ReminderBefore.NONE;
        };
    }

    private String reminderToClient(ReminderBefore value) {
        return switch (value) {
            case ONE_DAY -> "1_day";
            case TWO_HOURS -> "2_hours";
            case ONE_HOUR -> "1_hour";
            case NONE -> "none";
        };
    }

    private LocalDate dateFrom(String value) {
        return hasText(value) ? LocalDate.parse(value.trim()) : null;
    }

    private Set<Long> parseIds(List<String> values) {
        if (values == null) {
            return Set.of();
        }
        return values.stream()
                .filter(Objects::nonNull)
                .filter(this::hasText)
                .map(value -> Long.parseLong(value.trim()))
                .collect(Collectors.toSet());
    }

    private String required(String value, String message) {
        if (!hasText(value)) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String defaultValue(String value, String fallback) {
        return hasText(value) ? value.trim() : fallback;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private record DefaultLabel(String name, String color) {
    }
}
