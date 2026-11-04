package com.uniservice.vault.repository;

import com.uniservice.auth.entity.User;
import com.uniservice.vault.entity.VaultDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface VaultDocumentRepository extends JpaRepository<VaultDocument, Long> {
    List<VaultDocument> findByOwnerOrderByCreatedAtDesc(User owner);

    List<VaultDocument> findByOwnerAndVisibleToOwnerTrueOrderByCreatedAtDesc(User owner);

    List<VaultDocument> findByExpiresOnBetweenOrderByExpiresOnAsc(LocalDate from, LocalDate to);
}
