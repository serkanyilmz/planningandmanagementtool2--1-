package com.ser.ps.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "board_members")
@Getter
@Setter
@NoArgsConstructor
public class BoardMember {

    @EmbeddedId
    private BoardMemberId id = new BoardMemberId();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("boardId")
    @JoinColumn(name = "board_id")
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private BoardRole role = BoardRole.MEMBER;

    public BoardMember(Board board, User user, BoardRole role) {
        this.board = board;
        this.user = user;
        this.role = role;
        this.id = new BoardMemberId(board.getId(), user.getId());
    }
}
