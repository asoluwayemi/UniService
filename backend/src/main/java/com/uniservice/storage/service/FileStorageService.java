package com.uniservice.storage.service;

import com.uniservice.auth.entity.User;
import com.uniservice.storage.entity.StoredDocument;
import com.uniservice.storage.repository.StoredDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final StoredDocumentRepository repository;

    @Value("${app.uploads.dir:./uploads}")
    private String uploadsDir;

    public StoredDocument store(MultipartFile file, User uploader) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }
        try {
            Path root = Paths.get(uploadsDir).toAbsolutePath().normalize();
            Files.createDirectories(root);

            String storageKey = UUID.randomUUID().toString().replace("-", "");
            Path target = root.resolve(storageKey).normalize();
            if (!target.getParent().equals(root)) {
                throw new IllegalArgumentException("Invalid file path");
            }
            file.transferTo(target);

            StoredDocument document = StoredDocument.builder()
                    .storageKey(storageKey)
                    .originalFilename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document")
                    .contentType(file.getContentType())
                    .sizeBytes(file.getSize())
                    .uploadedBy(uploader)
                    .build();
            return repository.save(document);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store uploaded file", e);
        }
    }

    public StoredDocument findMetadata(String storageKey) {
        return repository.findByStorageKey(storageKey)
                .orElseThrow(() -> new NoSuchElementException("File not found"));
    }

    public Resource loadAsResource(StoredDocument document) {
        try {
            Path root = Paths.get(uploadsDir).toAbsolutePath().normalize();
            Path file = root.resolve(document.getStorageKey()).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new NoSuchElementException("File not found on disk");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new IllegalStateException("Failed to load stored file", e);
        }
    }
}
