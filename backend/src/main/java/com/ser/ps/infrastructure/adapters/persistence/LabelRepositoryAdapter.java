package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.application.ports.out.LabelRepositoryPort;
import com.ser.ps.domain.model.Label;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class LabelRepositoryAdapter implements LabelRepositoryPort {

    private final JpaLabelRepository repository;

    public LabelRepositoryAdapter(JpaLabelRepository repository) {
        this.repository = repository;
    }

    @Override
    public Label save(Label label) {
        return repository.save(label);
    }

    @Override
    public Optional<Label> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    public void delete(Label label) {
        repository.delete(label);
    }
}
