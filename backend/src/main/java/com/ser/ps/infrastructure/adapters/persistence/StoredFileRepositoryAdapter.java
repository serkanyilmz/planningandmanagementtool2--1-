package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.application.ports.out.StoredFileRepositoryPort;
import com.ser.ps.domain.model.StoredFile;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class StoredFileRepositoryAdapter implements StoredFileRepositoryPort {

    private final JpaStoredFileRepository repository;

    public StoredFileRepositoryAdapter(JpaStoredFileRepository repository) {
        this.repository = repository;
    }

    @Override
    public StoredFile save(StoredFile storedFile) {
        return repository.save(storedFile);
    }

    @Override
    public Optional<StoredFile> findById(Long id) {
        return repository.findById(id);
    }
}
