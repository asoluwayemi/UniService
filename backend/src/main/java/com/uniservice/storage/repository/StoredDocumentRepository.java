package com.uniservice.storage.repository;

import com.uniservice.storage.entity.StoredDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StoredDocumentRepository extends JpaRepository<StoredDocument, Long> {

    Optional<StoredDocument> findByStorageKey(String storageKey);
}
