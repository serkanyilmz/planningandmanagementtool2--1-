package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.domain.model.Label;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

interface JpaLabelRepository extends JpaRepository<Label, Long> {

    @Override
    @EntityGraph(attributePaths = {
            "board",
            "board.members",
            "board.labels",
            "board.lists",
            "board.lists.tasks",
            "board.lists.tasks.labels",
            "board.lists.tasks.assignees"
    })
    Optional<Label> findById(Long id);
}
