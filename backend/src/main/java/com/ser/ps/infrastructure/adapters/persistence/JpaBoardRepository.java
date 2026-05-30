package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.domain.model.Board;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface JpaBoardRepository extends JpaRepository<Board, Long> {

    @EntityGraph(attributePaths = {
            "createdBy",
            "members",
            "labels",
            "lists",
            "lists.tasks",
            "lists.tasks.labels",
            "lists.tasks.assignees"
    })
    @Query("select distinct b from Board b join b.members m where m.id = :userId")
    List<Board> findAllForMember(@Param("userId") Long userId);

    @Override
    @EntityGraph(attributePaths = {
            "createdBy",
            "members",
            "labels",
            "lists",
            "lists.tasks",
            "lists.tasks.labels",
            "lists.tasks.assignees"
    })
    Optional<Board> findById(Long id);
}
