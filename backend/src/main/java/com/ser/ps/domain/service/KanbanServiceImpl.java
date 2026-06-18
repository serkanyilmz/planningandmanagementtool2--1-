package com.ser.ps.domain.service;

import com.ser.ps.application.dto.AddBoardMemberRequest;
import com.ser.ps.application.dto.AssigneeResponse;
import com.ser.ps.application.dto.BoardMemberResponse;
import com.ser.ps.application.dto.BoardDataResponse;
import com.ser.ps.application.dto.BoardResponse;
import com.ser.ps.application.dto.CreateBoardRequest;
import com.ser.ps.application.dto.CreateLabelRequest;
import com.ser.ps.application.dto.CreateListRequest;
import com.ser.ps.application.dto.CreateTaskRequest;
import com.ser.ps.application.dto.KanbanListResponse;
import com.ser.ps.application.dto.LabelResponse;
import com.ser.ps.application.dto.MoveTaskRequest;
import com.ser.ps.application.dto.ReorderListsRequest;
import com.ser.ps.application.dto.TaskAttachmentResponse;
import com.ser.ps.application.dto.TaskResponse;
import com.ser.ps.application.dto.UpdateBoardMemberRoleRequest;
import com.ser.ps.application.dto.UpdateBoardRequest;
import com.ser.ps.application.dto.UpdateLabelRequest;
import com.ser.ps.application.dto.UpdateListRequest;
import com.ser.ps.application.dto.UpdateTaskRequest;
import com.ser.ps.application.dto.UploadedImage;
import com.ser.ps.application.ports.in.KanbanService;
import com.ser.ps.application.ports.out.BoardRepositoryPort;
import com.ser.ps.application.ports.out.KanbanListRepositoryPort;
import com.ser.ps.application.ports.out.LabelRepositoryPort;
import com.ser.ps.application.ports.out.StoredFileRepositoryPort;
import com.ser.ps.application.ports.out.TaskRepositoryPort;
import com.ser.ps.application.ports.out.UserRepositoryPort;
import com.ser.ps.domain.model.Board;
import com.ser.ps.domain.model.BoardMember;
import com.ser.ps.domain.model.BoardRole;
import com.ser.ps.domain.model.KanbanList;
import com.ser.ps.domain.model.Label;
import com.ser.ps.domain.model.ReminderBefore;
import com.ser.ps.domain.model.StoredFile;
import com.ser.ps.domain.model.Task;
import com.ser.ps.domain.model.TaskAttachment;
import com.ser.ps.domain.model.TaskPriority;
import com.ser.ps.domain.model.User;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Transactional
public class KanbanServiceImpl implements KanbanService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

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
    private final StoredFileRepositoryPort storedFileRepositoryPort;

    public KanbanServiceImpl(
            BoardRepositoryPort boardRepositoryPort,
            KanbanListRepositoryPort listRepositoryPort,
            TaskRepositoryPort taskRepositoryPort,
            LabelRepositoryPort labelRepositoryPort,
            UserRepositoryPort userRepositoryPort,
            StoredFileRepositoryPort storedFileRepositoryPort
    ) {
        this.boardRepositoryPort = boardRepositoryPort;
        this.listRepositoryPort = listRepositoryPort;
        this.taskRepositoryPort = taskRepositoryPort;
        this.labelRepositoryPort = labelRepositoryPort;
        this.userRepositoryPort = userRepositoryPort;
        this.storedFileRepositoryPort = storedFileRepositoryPort;
    }

    @Override
    public List<BoardResponse> getBoards(String username) {
        User user = currentUser(username);
        return boardRepositoryPort.findByMember(user.getId()).stream()
                .map(board -> toResponse(board, user))
                .toList();
    }

    @Override
    public BoardResponse getBoard(Long boardId, String username) {
        User user = currentUser(username);
        return toResponse(boardForUser(boardId, user), user);
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

        return toResponse(boardRepositoryPort.save(board), user);
    }

    @Override
    public BoardResponse updateBoard(Long boardId, UpdateBoardRequest request, String username) {
        User user = currentUser(username);
        Board board = boardForAdmin(boardId, user);
        if (hasText(request.title())) {
            board.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            board.setDescription(request.description().trim());
        }
        if (hasText(request.color())) {
            board.setColor(request.color().trim());
        }
        return toResponse(boardRepositoryPort.save(board), user);
    }

    @Override
    public void deleteBoard(Long boardId, String username) {
        Board board = boardForAdmin(boardId, currentUser(username));
        boardRepositoryPort.delete(board);
    }

    @Override
    public BoardResponse addMember(Long boardId, AddBoardMemberRequest request, String username) {
        User user = currentUser(username);
        Board board = boardForAdmin(boardId, user);
        User member = userRepositoryPort.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!board.isMember(member)) {
            board.addMember(member, BoardRole.MEMBER);
        }
        return toResponse(boardRepositoryPort.save(board), user);
    }

    @Override
    public BoardResponse updateMemberRole(Long boardId, Long userId, UpdateBoardMemberRoleRequest request, String username) {
        User user = currentUser(username);
        Board board = boardForAdmin(boardId, user);
        BoardMember member = memberForBoard(board, userId);
        BoardRole role = roleFrom(request.role());
        if (roleOf(member, board) == BoardRole.ADMIN && role != BoardRole.ADMIN && adminCount(board) == 1) {
            throw new IllegalArgumentException("Board must have at least one admin");
        }
        member.setRole(role);
        return toResponse(boardRepositoryPort.save(board), user);
    }

    @Override
    public BoardResponse removeMember(Long boardId, Long userId, String username) {
        User user = currentUser(username);
        Board board = boardForAdmin(boardId, user);
        BoardMember member = memberForBoard(board, userId);
        if (roleOf(member, board) == BoardRole.ADMIN && adminCount(board) == 1) {
            throw new IllegalArgumentException("Board must have at least one admin");
        }
        board.removeMember(userId);
        return toResponse(boardRepositoryPort.save(board), user);
    }

    @Override
    public BoardResponse addList(Long boardId, CreateListRequest request, String username) {
        User user = currentUser(username);
        Board board = boardForAdmin(boardId, user);
        KanbanList list = new KanbanList(required(request.title(), "List title is required"), board.getLists().size(), board);
        board.getLists().add(list);
        return toResponse(boardRepositoryPort.save(board), user);
    }

    @Override
    public BoardResponse reorderLists(Long boardId, ReorderListsRequest request, String username) {
        User user = currentUser(username);
        Board board = boardForAdmin(boardId, user);
        List<Long> listIds = request.listIds() == null ? List.of() : request.listIds();
        Set<Long> existingIds = board.getLists().stream().map(KanbanList::getId).collect(Collectors.toSet());
        if (listIds.size() != existingIds.size() || !existingIds.equals(Set.copyOf(listIds))) {
            throw new IllegalArgumentException("List order must include every board list exactly once");
        }
        for (int i = 0; i < listIds.size(); i++) {
            Long listId = listIds.get(i);
            board.getLists().stream()
                    .filter(list -> list.getId().equals(listId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("List not found"))
                    .setPosition(i);
        }
        return toResponse(boardRepositoryPort.save(board), user);
    }

    @Override
    public BoardResponse updateList(Long listId, UpdateListRequest request, String username) {
        User user = currentUser(username);
        KanbanList list = listForAdmin(listId, user);
        list.setTitle(required(request.title(), "List title is required"));
        listRepositoryPort.save(list);
        return toResponse(list.getBoard(), user);
    }

    @Override
    public BoardResponse deleteList(Long listId, String username) {
        User user = currentUser(username);
        KanbanList list = listForAdmin(listId, user);
        Board board = list.getBoard();
        board.getLists().remove(list);
        normalizeListPositions(board);
        return toResponse(boardRepositoryPort.save(board), user);
    }

    @Override
    public BoardResponse clearListTasks(Long listId, String username) {
        User user = currentUser(username);
        KanbanList list = listForUser(listId, user);
        list.getTasks().clear();
        listRepositoryPort.save(list);
        return toResponse(list.getBoard(), user);
    }

    @Override
    public BoardResponse addTask(Long listId, CreateTaskRequest request, String username) {
        User user = currentUser(username);
        KanbanList list = listForUser(listId, user);
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
        return toResponse(list.getBoard(), user);
    }

    @Override
    public BoardResponse updateTask(Long taskId, UpdateTaskRequest request, String username) {
        User user = currentUser(username);
        Task task = taskForUser(taskId, user);
        task.setTitle(required(request.title(), "Task title is required"));
        task.setDescription(defaultValue(request.description(), ""));
        task.setPriority(priorityFrom(request.priority()));
        task.setDueDate(dateFrom(request.dueDate()));
        task.setReminderBefore(reminderFrom(request.reminderBefore()));
        applyTaskRelations(task, task.getList().getBoard(), request.labelIds(), request.assigneeIds());
        taskRepositoryPort.save(task);
        return toResponse(task.getList().getBoard(), user);
    }

    @Override
    public BoardResponse deleteTask(Long taskId, String username) {
        User user = currentUser(username);
        Task task = taskForUser(taskId, user);
        KanbanList list = task.getList();
        list.getTasks().remove(task);
        normalizeTaskPositions(list);
        listRepositoryPort.save(list);
        return toResponse(list.getBoard(), user);
    }

    @Override
    public BoardResponse moveTask(Long taskId, MoveTaskRequest request, String username) {
        User user = currentUser(username);
        Task task = taskForUser(taskId, user);
        KanbanList sourceList = task.getList();
        KanbanList targetList = listForUser(request.targetListId(), user);

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
        return toResponse(targetList.getBoard(), user);
    }

    @Override
    public BoardResponse addTaskAttachment(Long taskId, UploadedImage image, String username) {
        User user = currentUser(username);
        Task task = taskForUser(taskId, user);
        StoredFile storedFile = storeImage(image, user);
        TaskAttachment attachment = new TaskAttachment(task, storedFile, user);
        attachment.setCover(task.getAttachments().isEmpty());
        task.getAttachments().add(attachment);
        taskRepositoryPort.save(task);
        return toResponse(task.getList().getBoard(), user);
    }

    @Override
    public BoardResponse setTaskAttachmentCover(Long taskId, Long attachmentId, String username) {
        User user = currentUser(username);
        Task task = taskForUser(taskId, user);
        TaskAttachment coverAttachment = task.getAttachments().stream()
                .filter(attachment -> attachment.getId().equals(attachmentId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
        task.getAttachments().forEach(attachment -> attachment.setCover(false));
        coverAttachment.setCover(true);
        taskRepositoryPort.save(task);
        return toResponse(task.getList().getBoard(), user);
    }

    @Override
    public BoardResponse deleteTaskAttachment(Long taskId, Long attachmentId, String username) {
        User user = currentUser(username);
        Task task = taskForUser(taskId, user);
        boolean removedCover = task.getAttachments().stream()
                .anyMatch(attachment -> attachment.getId().equals(attachmentId) && attachment.isCover());
        boolean removed = task.getAttachments().removeIf(attachment -> attachment.getId().equals(attachmentId));
        if (!removed) {
            throw new IllegalArgumentException("Attachment not found");
        }
        if (removedCover && !task.getAttachments().isEmpty()) {
            task.getAttachments().stream()
                    .min(Comparator.comparing(TaskAttachment::getId))
                    .ifPresent(attachment -> attachment.setCover(true));
        }
        taskRepositoryPort.save(task);
        return toResponse(task.getList().getBoard(), user);
    }

    @Override
    public BoardResponse addLabel(Long boardId, CreateLabelRequest request, String username) {
        User user = currentUser(username);
        Board board = boardForAdmin(boardId, user);
        board.getLabels().add(new Label(required(request.name(), "Label name is required"), required(request.color(), "Label color is required"), board));
        return toResponse(boardRepositoryPort.save(board), user);
    }

    @Override
    public BoardResponse updateLabel(Long labelId, UpdateLabelRequest request, String username) {
        User user = currentUser(username);
        Label label = labelForAdmin(labelId, user);
        label.setName(required(request.name(), "Label name is required"));
        label.setColor(required(request.color(), "Label color is required"));
        labelRepositoryPort.save(label);
        return toResponse(label.getBoard(), user);
    }

    @Override
    public BoardResponse deleteLabel(Long labelId, String username) {
        User user = currentUser(username);
        Label label = labelForAdmin(labelId, user);
        Board board = label.getBoard();
        for (KanbanList list : board.getLists()) {
            for (Task task : list.getTasks()) {
                task.getLabels().removeIf(existing -> existing.getId().equals(labelId));
            }
        }
        board.getLabels().remove(label);
        return toResponse(boardRepositoryPort.save(board), user);
    }

    private void applyTaskRelations(Task task, Board board, List<String> labelIds, List<String> assigneeIds) {
        Set<Long> labelIdSet = parseIds(labelIds);
        task.getLabels().clear();
        board.getLabels().stream()
                .filter(label -> labelIdSet.contains(label.getId()))
                .forEach(task.getLabels()::add);

        Set<Long> assigneeIdSet = parseIds(assigneeIds);
        task.getAssignees().clear();
        board.getBoardMembers().stream()
                .map(BoardMember::getUser)
                .filter(member -> assigneeIdSet.contains(member.getId()))
                .forEach(task.getAssignees()::add);
    }

    private Board boardForUser(Long boardId, User user) {
        Board board = boardRepositoryPort.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));
        if (!board.isMember(user)) {
            throw new IllegalArgumentException("You do not have access to this board");
        }
        return board;
    }

    private Board boardForAdmin(Long boardId, User user) {
        Board board = boardForUser(boardId, user);
        if (!board.isAdmin(user)) {
            throw new IllegalArgumentException("Only board admins can perform this action");
        }
        return board;
    }

    private KanbanList listForUser(Long listId, User user) {
        KanbanList list = listRepositoryPort.findById(listId)
                .orElseThrow(() -> new IllegalArgumentException("List not found"));
        boardForUser(list.getBoard().getId(), user);
        return list;
    }

    private KanbanList listForAdmin(Long listId, User user) {
        KanbanList list = listRepositoryPort.findById(listId)
                .orElseThrow(() -> new IllegalArgumentException("List not found"));
        boardForAdmin(list.getBoard().getId(), user);
        return list;
    }

    private Task taskForUser(Long taskId, User user) {
        Task task = taskRepositoryPort.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        boardForUser(task.getList().getBoard().getId(), user);
        return task;
    }

    private Label labelForAdmin(Long labelId, User user) {
        Label label = labelRepositoryPort.findById(labelId)
                .orElseThrow(() -> new IllegalArgumentException("Label not found"));
        boardForAdmin(label.getBoard().getId(), user);
        return label;
    }

    private User currentUser(String username) {
        return userRepositoryPort.findByUsernameOrEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    }

    private BoardResponse toResponse(Board board, User viewer) {
        List<KanbanListResponse> lists = board.getLists().stream()
                .sorted(Comparator.comparingInt(KanbanList::getPosition))
                .map(this::toResponse)
                .toList();

        List<String> memberIds = board.getBoardMembers().stream()
                .map(member -> String.valueOf(member.getUser().getId()))
                .sorted()
                .toList();

        List<BoardMemberResponse> members = board.getBoardMembers().stream()
                .sorted(Comparator.comparing(member -> member.getUser().getId()))
                .map(member -> new BoardMemberResponse(
                        String.valueOf(member.getUser().getId()),
                        member.getUser().getFullName(),
                        member.getUser().getEmail(),
                        avatarUrl(member.getUser()),
                        roleOf(member, board).name().toLowerCase(Locale.ROOT)
                ))
                .toList();

        String currentUserRole = board.getBoardMembers().stream()
                .filter(member -> member.getUser().getId().equals(viewer.getId()))
                .map(member -> roleOf(member, board).name().toLowerCase(Locale.ROOT))
                .findFirst()
                .orElse("member");

        List<LabelResponse> labels = board.getLabels().stream()
                .sorted(Comparator.comparing(Label::getId))
                .map(this::toResponse)
                .toList();

        return new BoardResponse(
                String.valueOf(board.getId()),
                boardKey(board.getId()),
                board.getTitle(),
                board.getDescription(),
                board.getColor(),
                memberIds,
                members,
                currentUserRole,
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
        Board board = task.getList().getBoard();
        return new TaskResponse(
                String.valueOf(task.getId()),
                taskKey(board.getId(), task.getId()),
                String.valueOf(board.getId()),
                boardKey(board.getId()),
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
                        .map(user -> new AssigneeResponse(String.valueOf(user.getId()), user.getFullName(), avatarUrl(user)))
                        .toList(),
                reminderToClient(task.getReminderBefore()),
                task.getAttachments().stream()
                        .sorted(Comparator.comparing(TaskAttachment::isCover).reversed().thenComparing(TaskAttachment::getId))
                        .map(this::toResponse)
                        .toList()
        );
    }

    private TaskAttachmentResponse toResponse(TaskAttachment attachment) {
        StoredFile file = attachment.getStoredFile();
        return new TaskAttachmentResponse(
                String.valueOf(attachment.getId()),
                String.valueOf(file.getId()),
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSizeBytes(),
                "/api/files/" + file.getId(),
                attachment.isCover()
        );
    }

    private LabelResponse toResponse(Label label) {
        return new LabelResponse(String.valueOf(label.getId()), label.getName(), label.getColor());
    }

    private BoardMember memberForBoard(Board board, Long userId) {
        return board.getBoardMembers().stream()
                .filter(member -> member.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Board member not found"));
    }

    private long adminCount(Board board) {
        return board.getBoardMembers().stream()
                .filter(member -> roleOf(member, board) == BoardRole.ADMIN)
                .count();
    }

    private BoardRole roleOf(BoardMember member, Board board) {
        if (member.getRole() != null) {
            return member.getRole();
        }
        return board.getCreatedBy().getId().equals(member.getUser().getId()) ? BoardRole.ADMIN : BoardRole.MEMBER;
    }

    private BoardRole roleFrom(String value) {
        if (!hasText(value)) {
            throw new IllegalArgumentException("Role is required");
        }
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "admin" -> BoardRole.ADMIN;
            case "member" -> BoardRole.MEMBER;
            default -> throw new IllegalArgumentException("Unsupported board role");
        };
    }

    private StoredFile storeImage(UploadedImage image, User user) {
        if (image == null || image.data() == null || image.data().length == 0 || image.sizeBytes() <= 0) {
            throw new IllegalArgumentException("Image file is required");
        }
        if (image.sizeBytes() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Image must be 5MB or smaller");
        }
        if (!ALLOWED_IMAGE_TYPES.contains(image.contentType())) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP, and GIF images are supported");
        }
        String filename = hasText(image.originalFilename()) ? image.originalFilename().trim() : "image";
        return storedFileRepositoryPort.save(new StoredFile(filename, image.contentType(), image.sizeBytes(), image.data(), user));
    }

    private String avatarUrl(User user) {
        return user.getProfileImage() == null ? "" : "/api/files/" + user.getProfileImage().getId();
    }

    private String boardKey(Long boardId) {
        return "BOARD-" + boardId;
    }

    private String taskKey(Long boardId, Long taskId) {
        return boardKey(boardId) + "-TASK-" + taskId;
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
