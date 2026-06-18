package com.ser.ps.infrastructure.adapters.web;

import com.ser.ps.application.dto.AddBoardMemberRequest;
import com.ser.ps.application.dto.BoardEventResponse;
import com.ser.ps.application.dto.BoardResponse;
import com.ser.ps.application.dto.CreateBoardRequest;
import com.ser.ps.application.dto.CreateLabelRequest;
import com.ser.ps.application.dto.CreateListRequest;
import com.ser.ps.application.dto.CreateTaskRequest;
import com.ser.ps.application.dto.MoveTaskRequest;
import com.ser.ps.application.dto.ReorderListsRequest;
import com.ser.ps.application.dto.UpdateBoardMemberRoleRequest;
import com.ser.ps.application.dto.UpdateBoardRequest;
import com.ser.ps.application.dto.UpdateLabelRequest;
import com.ser.ps.application.dto.UpdateListRequest;
import com.ser.ps.application.dto.UpdateTaskRequest;
import com.ser.ps.application.dto.UploadedImage;
import com.ser.ps.application.ports.in.KanbanService;
import java.io.IOException;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class KanbanController {

    private final KanbanService kanbanService;
    private final SimpMessagingTemplate messagingTemplate;

    public KanbanController(KanbanService kanbanService, SimpMessagingTemplate messagingTemplate) {
        this.kanbanService = kanbanService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/boards")
    public List<BoardResponse> getBoards(Principal principal) {
        return kanbanService.getBoards(principal.getName());
    }

    @PostMapping("/boards")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardResponse createBoard(@RequestBody CreateBoardRequest request, Principal principal) {
        BoardResponse board = kanbanService.createBoard(request, principal.getName());
        publish("BOARD_CREATED", board);
        return board;
    }

    @GetMapping("/boards/{boardId}")
    public BoardResponse getBoard(@PathVariable Long boardId, Principal principal) {
        return kanbanService.getBoard(boardId, principal.getName());
    }

    @PutMapping("/boards/{boardId}")
    public BoardResponse updateBoard(
            @PathVariable Long boardId,
            @RequestBody UpdateBoardRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.updateBoard(boardId, request, principal.getName());
        publish("BOARD_UPDATED", board);
        return board;
    }

    @DeleteMapping("/boards/{boardId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBoard(@PathVariable Long boardId, Principal principal) {
        kanbanService.deleteBoard(boardId, principal.getName());
    }

    @PostMapping("/boards/{boardId}/members")
    public BoardResponse addMember(
            @PathVariable Long boardId,
            @RequestBody AddBoardMemberRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.addMember(boardId, request, principal.getName());
        publish("BOARD_MEMBER_ADDED", board);
        return board;
    }

    @PatchMapping("/boards/{boardId}/members/{userId}/role")
    public BoardResponse updateMemberRole(
            @PathVariable Long boardId,
            @PathVariable Long userId,
            @RequestBody UpdateBoardMemberRoleRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.updateMemberRole(boardId, userId, request, principal.getName());
        publish("BOARD_MEMBER_ROLE_UPDATED", board);
        return board;
    }

    @DeleteMapping("/boards/{boardId}/members/{userId}")
    public BoardResponse removeMember(
            @PathVariable Long boardId,
            @PathVariable Long userId,
            Principal principal
    ) {
        BoardResponse board = kanbanService.removeMember(boardId, userId, principal.getName());
        publish("BOARD_MEMBER_REMOVED", board);
        return board;
    }

    @PostMapping("/boards/{boardId}/lists")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardResponse addList(
            @PathVariable Long boardId,
            @RequestBody CreateListRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.addList(boardId, request, principal.getName());
        publish("LIST_CREATED", board);
        return board;
    }

    @PatchMapping("/boards/{boardId}/lists/reorder")
    public BoardResponse reorderLists(
            @PathVariable Long boardId,
            @RequestBody ReorderListsRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.reorderLists(boardId, request, principal.getName());
        publish("LISTS_REORDERED", board);
        return board;
    }

    @PutMapping("/lists/{listId}")
    public BoardResponse updateList(
            @PathVariable Long listId,
            @RequestBody UpdateListRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.updateList(listId, request, principal.getName());
        publish("LIST_UPDATED", board);
        return board;
    }

    @DeleteMapping("/lists/{listId}")
    public BoardResponse deleteList(@PathVariable Long listId, Principal principal) {
        BoardResponse board = kanbanService.deleteList(listId, principal.getName());
        publish("LIST_DELETED", board);
        return board;
    }

    @DeleteMapping("/lists/{listId}/tasks")
    public BoardResponse clearListTasks(@PathVariable Long listId, Principal principal) {
        BoardResponse board = kanbanService.clearListTasks(listId, principal.getName());
        publish("LIST_TASKS_CLEARED", board);
        return board;
    }

    @PostMapping("/lists/{listId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardResponse addTask(
            @PathVariable Long listId,
            @RequestBody CreateTaskRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.addTask(listId, request, principal.getName());
        publish("TASK_CREATED", board);
        return board;
    }

    @PutMapping("/tasks/{taskId}")
    public BoardResponse updateTask(
            @PathVariable Long taskId,
            @RequestBody UpdateTaskRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.updateTask(taskId, request, principal.getName());
        publish("TASK_UPDATED", board);
        return board;
    }

    @DeleteMapping("/tasks/{taskId}")
    public BoardResponse deleteTask(@PathVariable Long taskId, Principal principal) {
        BoardResponse board = kanbanService.deleteTask(taskId, principal.getName());
        publish("TASK_DELETED", board);
        return board;
    }

    @PatchMapping("/tasks/{taskId}/move")
    public BoardResponse moveTask(
            @PathVariable Long taskId,
            @RequestBody MoveTaskRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.moveTask(taskId, request, principal.getName());
        publish("TASK_MOVED", board);
        return board;
    }

    @PostMapping(value = "/tasks/{taskId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BoardResponse addTaskAttachment(
            @PathVariable Long taskId,
            @RequestPart("file") MultipartFile file,
            Principal principal
    ) throws IOException {
        BoardResponse board = kanbanService.addTaskAttachment(taskId, toUploadedImage(file), principal.getName());
        publish("TASK_ATTACHMENT_ADDED", board);
        return board;
    }

    @PatchMapping("/tasks/{taskId}/attachments/{attachmentId}/cover")
    public BoardResponse setTaskAttachmentCover(
            @PathVariable Long taskId,
            @PathVariable Long attachmentId,
            Principal principal
    ) {
        BoardResponse board = kanbanService.setTaskAttachmentCover(taskId, attachmentId, principal.getName());
        publish("TASK_ATTACHMENT_COVER_UPDATED", board);
        return board;
    }

    @DeleteMapping("/tasks/{taskId}/attachments/{attachmentId}")
    public BoardResponse deleteTaskAttachment(
            @PathVariable Long taskId,
            @PathVariable Long attachmentId,
            Principal principal
    ) {
        BoardResponse board = kanbanService.deleteTaskAttachment(taskId, attachmentId, principal.getName());
        publish("TASK_ATTACHMENT_DELETED", board);
        return board;
    }

    @PostMapping("/boards/{boardId}/labels")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardResponse addLabel(
            @PathVariable Long boardId,
            @RequestBody CreateLabelRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.addLabel(boardId, request, principal.getName());
        publish("LABEL_CREATED", board);
        return board;
    }

    @PutMapping("/labels/{labelId}")
    public BoardResponse updateLabel(
            @PathVariable Long labelId,
            @RequestBody UpdateLabelRequest request,
            Principal principal
    ) {
        BoardResponse board = kanbanService.updateLabel(labelId, request, principal.getName());
        publish("LABEL_UPDATED", board);
        return board;
    }

    @DeleteMapping("/labels/{labelId}")
    public BoardResponse deleteLabel(@PathVariable Long labelId, Principal principal) {
        BoardResponse board = kanbanService.deleteLabel(labelId, principal.getName());
        publish("LABEL_DELETED", board);
        return board;
    }

    private void publish(String type, BoardResponse board) {
        messagingTemplate.convertAndSend("/topic/boards/" + board.id(), new BoardEventResponse(type, board));
    }

    private UploadedImage toUploadedImage(MultipartFile file) throws IOException {
        return new UploadedImage(
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSize(),
                file.getBytes()
        );
    }
}
