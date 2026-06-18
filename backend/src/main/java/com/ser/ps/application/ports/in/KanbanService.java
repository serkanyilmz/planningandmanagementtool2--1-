package com.ser.ps.application.ports.in;

import com.ser.ps.application.dto.AddBoardMemberRequest;
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
import java.util.List;

public interface KanbanService {

    List<BoardResponse> getBoards(String username);

    BoardResponse getBoard(Long boardId, String username);

    BoardResponse createBoard(CreateBoardRequest request, String username);

    BoardResponse updateBoard(Long boardId, UpdateBoardRequest request, String username);

    void deleteBoard(Long boardId, String username);

    BoardResponse addMember(Long boardId, AddBoardMemberRequest request, String username);

    BoardResponse updateMemberRole(Long boardId, Long userId, UpdateBoardMemberRoleRequest request, String username);

    BoardResponse removeMember(Long boardId, Long userId, String username);

    BoardResponse addList(Long boardId, CreateListRequest request, String username);

    BoardResponse reorderLists(Long boardId, ReorderListsRequest request, String username);

    BoardResponse updateList(Long listId, UpdateListRequest request, String username);

    BoardResponse deleteList(Long listId, String username);

    BoardResponse clearListTasks(Long listId, String username);

    BoardResponse addTask(Long listId, CreateTaskRequest request, String username);

    BoardResponse updateTask(Long taskId, UpdateTaskRequest request, String username);

    BoardResponse deleteTask(Long taskId, String username);

    BoardResponse moveTask(Long taskId, MoveTaskRequest request, String username);

    BoardResponse addTaskAttachment(Long taskId, UploadedImage image, String username);

    BoardResponse setTaskAttachmentCover(Long taskId, Long attachmentId, String username);

    BoardResponse deleteTaskAttachment(Long taskId, Long attachmentId, String username);

    BoardResponse addLabel(Long boardId, CreateLabelRequest request, String username);

    BoardResponse updateLabel(Long labelId, UpdateLabelRequest request, String username);

    BoardResponse deleteLabel(Long labelId, String username);
}
