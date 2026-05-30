package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.application.ports.out.BoardRepositoryPort;
import com.ser.ps.domain.model.Board;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class BoardRepositoryAdapter implements BoardRepositoryPort {

    private final JpaBoardRepository repository;

    public BoardRepositoryAdapter(JpaBoardRepository repository) {
        this.repository = repository;
    }

    @Override
    public Board save(Board board) {
        return repository.save(board);
    }

    @Override
    public List<Board> findByMember(Long userId) {
        return repository.findAllForMember(userId);
    }

    @Override
    public Optional<Board> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public void delete(Board board) {
        repository.delete(board);
    }
}
