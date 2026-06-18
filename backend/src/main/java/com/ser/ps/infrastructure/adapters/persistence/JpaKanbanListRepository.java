package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.domain.model.KanbanList;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

interface JpaKanbanListRepository extends JpaRepository<KanbanList, Long> {

    @Override
    @EntityGraph(attributePaths = {
            "board",
            "board.boardMembers",
            "board.boardMembers.user",
            "board.boardMembers.user.profileImage",
            "board.labels",
            "board.lists",
            "board.lists.tasks",
            "board.lists.tasks.labels",
            "board.lists.tasks.assignees",
            "board.lists.tasks.assignees.profileImage",
            "board.lists.tasks.attachments",
            "board.lists.tasks.attachments.storedFile",
            "tasks",
            "tasks.labels",
            "tasks.assignees",
            "tasks.attachments",
            "tasks.attachments.storedFile"
    })
    Optional<KanbanList> findById(Long id);
}
