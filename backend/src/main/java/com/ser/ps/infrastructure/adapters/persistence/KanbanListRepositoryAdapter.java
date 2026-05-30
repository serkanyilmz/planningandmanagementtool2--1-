package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.application.ports.out.KanbanListRepositoryPort;
import com.ser.ps.domain.model.KanbanList;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class KanbanListRepositoryAdapter implements KanbanListRepositoryPort {

    private final JpaKanbanListRepository repository;

    public KanbanListRepositoryAdapter(JpaKanbanListRepository repository) {
        this.repository = repository;
    }

    @Override
    public KanbanList save(KanbanList list) {
        return repository.save(list);
    }

    @Override
    public Optional<KanbanList> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public void delete(KanbanList list) {
        repository.delete(list);
    }
}
