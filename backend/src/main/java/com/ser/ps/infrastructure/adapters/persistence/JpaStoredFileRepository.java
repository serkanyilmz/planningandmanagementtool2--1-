package com.ser.ps.infrastructure.adapters.persistence;

import com.ser.ps.domain.model.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;

interface JpaStoredFileRepository extends JpaRepository<StoredFile, Long> {
}
