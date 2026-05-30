package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.domain.model.Task;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

interface JpaTaskRepository extends JpaRepository<Task, Long> {

    @Override
    @EntityGraph(attributePaths = {
            "list",
            "list.board",
            "list.board.members",
            "list.board.labels",
            "list.board.lists",
            "list.board.lists.tasks",
            "list.board.lists.tasks.labels",
            "list.board.lists.tasks.assignees",
            "labels",
            "assignees"
    })
    Optional<Task> findById(Long id);
}
