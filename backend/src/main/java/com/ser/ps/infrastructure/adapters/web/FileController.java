package com.ser.ps.infrastructure.adapters.web;

import com.ser.ps.application.ports.out.StoredFileRepositoryPort;
import com.ser.ps.domain.model.StoredFile;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final StoredFileRepositoryPort storedFileRepositoryPort;

    public FileController(StoredFileRepositoryPort storedFileRepositoryPort) {
        this.storedFileRepositoryPort = storedFileRepositoryPort;
    }

    @GetMapping("/{fileId}")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> getFile(@PathVariable Long fileId) {
        StoredFile file = storedFileRepositoryPort.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getOriginalFilename() + "\"")
                .cacheControl(CacheControl.noCache())
                .body(file.getData());
    }
}
