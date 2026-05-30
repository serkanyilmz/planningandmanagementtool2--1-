package com.ser.ps.application.ports.out;

import com.ser.ps.domain.model.Task;
import java.util.Optional;

public interface TaskRepositoryPort {

    Task save(Task task);

    Optional<Task> findById(Long id);

    void delete(Task task);
}
