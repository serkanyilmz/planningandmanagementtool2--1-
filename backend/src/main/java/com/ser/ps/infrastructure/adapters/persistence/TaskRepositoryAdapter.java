package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.application.ports.out.TaskRepositoryPort;
import com.ser.ps.domain.model.Task;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class TaskRepositoryAdapter implements TaskRepositoryPort {

    private final JpaTaskRepository repository;

    public TaskRepositoryAdapter(JpaTaskRepository repository) {
        this.repository = repository;
    }

    @Override
    public Task save(Task task) {
        return repository.save(task);
    }

    @Override
    public Optional<Task> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public void delete(Task task) {
        repository.delete(task);
    }
}
