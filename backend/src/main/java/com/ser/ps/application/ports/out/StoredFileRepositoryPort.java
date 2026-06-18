package com.ser.ps.application.ports.out;

import com.ser.ps.domain.model.StoredFile;
import java.util.Optional;

public interface StoredFileRepositoryPort {

    StoredFile save(StoredFile storedFile);

    Optional<StoredFile> findById(Long id);
}
