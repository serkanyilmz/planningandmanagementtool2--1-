package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.domain.model.KanbanList;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

interface JpaKanbanListRepository extends JpaRepository<KanbanList, Long> {

    @Override
    @EntityGraph(attributePaths = {
            "board",
            "board.members",
            "board.labels",
            "board.lists",
            "board.lists.tasks",
            "board.lists.tasks.labels",
            "board.lists.tasks.assignees",
            "tasks",
            "tasks.labels",
            "tasks.assignees"
    })
    Optional<KanbanList> findById(Long id);
}
