package com.uniservice.vault.dto;

import com.uniservice.vault.entity.VaultCategory;
import com.uniservice.vault.entity.VaultDocument;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/** Deliberately omits the storage key: the file is only reachable through the authorised vault download. */
public record VaultDocumentResponse(Long id, String ownerUsername, String ownerName, VaultCategory category,
                                    String title, String description, String filename, String contentType,
                                    long sizeBytes, LocalDate expiresOn, Long daysToExpiry, boolean visibleToOwner,
                                    String uploadedBy, Instant uploadedAt) {
    public static VaultDocumentResponse from(VaultDocument d, LocalDate today) {
        String ownerName = ((d.getOwner().getFirstName() == null ? "" : d.getOwner().getFirstName()) + " "
                + (d.getOwner().getLastName() == null ? "" : d.getOwner().getLastName())).trim();
        Long days = d.getExpiresOn() == null ? null : ChronoUnit.DAYS.between(today, d.getExpiresOn());
        return new VaultDocumentResponse(d.getId(), d.getOwner().getUsername(), ownerName, d.getCategory(),
                d.getTitle(), d.getDescription(), d.getStoredDocument().getOriginalFilename(),
                d.getStoredDocument().getContentType(), d.getStoredDocument().getSizeBytes(), d.getExpiresOn(), days,
                d.isVisibleToOwner(), d.getStoredDocument().getUploadedBy().getUsername(), d.getCreatedAt());
    }
}
