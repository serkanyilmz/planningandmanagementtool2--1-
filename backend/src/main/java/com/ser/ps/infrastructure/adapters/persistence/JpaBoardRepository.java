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
            "boardMembers",
            "boardMembers.user",
            "boardMembers.user.profileImage",
            "labels",
            "lists",
            "lists.tasks",
            "lists.tasks.labels",
            "lists.tasks.assignees",
            "lists.tasks.assignees.profileImage",
            "lists.tasks.attachments",
            "lists.tasks.attachments.storedFile"
    })
    @Query("select distinct b from Board b join b.boardMembers bm where bm.user.id = :userId")
    List<Board> findAllForMember(@Param("userId") Long userId);

    @Override
    @EntityGraph(attributePaths = {
            "createdBy",
            "boardMembers",
            "boardMembers.user",
            "boardMembers.user.profileImage",
            "labels",
            "lists",
            "lists.tasks",
            "lists.tasks.labels",
            "lists.tasks.assignees",
            "lists.tasks.assignees.profileImage",
            "lists.tasks.attachments",
            "lists.tasks.attachments.storedFile"
    })
    Optional<Board> findById(Long id);
}
