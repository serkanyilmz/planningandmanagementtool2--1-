package com.ser.ps.domain.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "boards")
@Getter
@Setter
@NoArgsConstructor
public class Board extends BaseEntity {

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "color", nullable = false)
    private String color;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BoardMember> boardMembers = new HashSet<>();

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private Set<KanbanList> lists = new HashSet<>();

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private Set<Label> labels = new HashSet<>();

    public Board(String title, String description, String color, User createdBy) {
        this.title = title;
        this.description = description;
        this.color = color;
        this.createdBy = createdBy;
        addMember(createdBy, BoardRole.ADMIN);
    }

    public boolean isMember(User user) {
        return boardMembers.stream().anyMatch(member -> member.getUser().getId().equals(user.getId()));
    }

    public boolean isAdmin(User user) {
        return boardMembers.stream()
                .anyMatch(member -> member.getUser().getId().equals(user.getId())
                        && (member.getRole() == BoardRole.ADMIN || (member.getRole() == null && createdBy.getId().equals(user.getId()))));
    }

    public BoardMember addMember(User user, BoardRole role) {
        BoardMember member = new BoardMember(this, user, role);
        boardMembers.add(member);
        return member;
    }

    public void removeMember(Long userId) {
        boardMembers.removeIf(member -> member.getUser().getId().equals(userId));
    }
}
