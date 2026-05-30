package com.ser.ps.application.ports.out;

import com.ser.ps.domain.model.KanbanList;
import java.util.Optional;

public interface KanbanListRepositoryPort {

    KanbanList save(KanbanList list);

    Optional<KanbanList> findById(Long id);

    void delete(KanbanList list);
}
