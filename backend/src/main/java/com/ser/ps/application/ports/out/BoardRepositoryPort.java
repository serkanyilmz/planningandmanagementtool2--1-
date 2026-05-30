package com.ser.ps.application.ports.out;

import com.ser.ps.domain.model.Board;
import java.util.List;
import java.util.Optional;

public interface BoardRepositoryPort {

    Board save(Board board);

    List<Board> findByMember(Long userId);

    Optional<Board> findById(Long id);

    void delete(Board board);
}
