package com.uniservice.vault.service;

import com.uniservice.audit.service.AuditService;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.storage.entity.StoredDocument;
import com.uniservice.storage.service.FileStorageService;
import com.uniservice.vault.dto.StaffLookupResponse;
import com.uniservice.vault.dto.VaultDocumentResponse;
import com.uniservice.vault.entity.VaultCategory;
import com.uniservice.vault.entity.VaultDocument;
import com.uniservice.vault.repository.VaultDocumentRepository;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class VaultService {

    static final long MAX_BYTES = 10L * 1024 * 1024;

    /** extension -> content types accepted for it. Both must match, since the client controls the header. */
    private static final Map<String, List<String>> ALLOWED = Map.of(
            "pdf", List.of("application/pdf"),
            "png", List.of("image/png"),
            "jpg", List.of("image/jpeg"),
            "jpeg", List.of("image/jpeg"),
            "doc", List.of("application/msword"),
            "docx", List.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));

    public record Download(StoredDocument document, Resource resource) {
    }

    private final VaultDocumentRepository vault;
    private final FileStorageService storage;
    private final UserRepository users;
    private final AuditService audit;
    private final Clock clock;

    public VaultService(VaultDocumentRepository vault, FileStorageService storage, UserRepository users,
                        AuditService audit, Clock clock) {
        this.vault = vault;
        this.storage = storage;
        this.users = users;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public StaffLookupResponse lookup(String email) {
        User u = users.findByEmail(email.trim())
                .orElseThrow(() -> new NoSuchElementException("No staff account found with email " + email.trim()));
        return new StaffLookupResponse(u.getId(), u.getUsername(),
                ((u.getFirstName() == null ? "" : u.getFirstName()) + " " + (u.getLastName() == null ? "" : u.getLastName())).trim(),
                u.getEmail());
    }

    @Transactional
    public VaultDocumentResponse upload(Long ownerUserId, MultipartFile file, VaultCategory category, String title,
                                        String description, LocalDate expiresOn, boolean visibleToOwner, User actor) {
        User owner = users.findById(ownerUserId).orElseThrow(() -> new NoSuchElementException("Staff account not found"));
        validateFile(file);
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("A title is required");
        }
        StoredDocument stored = storage.store(file, actor);
        VaultDocument saved = vault.save(VaultDocument.builder()
                .owner(owner).storedDocument(stored).category(category).title(title.trim())
                .description(description == null || description.isBlank() ? null : description.trim())
                .expiresOn(expiresOn).visibleToOwner(visibleToOwner).build());
        audit.record(actor.getUsername(), "VAULT_DOCUMENT_UPLOADED", "VaultDocument", String.valueOf(saved.getId()),
                category + " for " + owner.getUsername());
        return VaultDocumentResponse.from(saved, LocalDate.now(clock));
    }

    @Transactional(readOnly = true)
    public List<VaultDocumentResponse> forStaff(Long ownerUserId) {
        User owner = users.findById(ownerUserId).orElseThrow(() -> new NoSuchElementException("Staff account not found"));
        LocalDate today = LocalDate.now(clock);
        return vault.findByOwnerOrderByCreatedAtDesc(owner).stream().map(d -> VaultDocumentResponse.from(d, today)).toList();
    }

    /** A staff member's own records, excluding those marked HR-only. */
    @Transactional(readOnly = true)
    public List<VaultDocumentResponse> mine(User user) {
        LocalDate today = LocalDate.now(clock);
        return vault.findByOwnerAndVisibleToOwnerTrueOrderByCreatedAtDesc(user).stream()
                .map(d -> VaultDocumentResponse.from(d, today)).toList();
    }

    @Transactional(readOnly = true)
    public List<VaultDocumentResponse> expiring(int days) {
        LocalDate today = LocalDate.now(clock);
        int window = Math.min(Math.max(days, 1), 365);
        return vault.findByExpiresOnBetweenOrderByExpiresOnAsc(today, today.plusDays(window)).stream()
                .map(d -> VaultDocumentResponse.from(d, today)).toList();
    }

    /** Managers may download anything (and it is audited); owners only their own non-HR-only records. */
    @Transactional(readOnly = true)
    public Download download(Long documentId, User caller, boolean manager) {
        VaultDocument d = find(documentId);
        boolean isOwner = d.getOwner().getId() != null && d.getOwner().getId().equals(caller.getId());
        if (!manager && !(isOwner && d.isVisibleToOwner())) {
            // same message as "missing" so record ids cannot be probed
            throw new NoSuchElementException("Document not found");
        }
        if (manager && !isOwner) {
            audit.record(caller.getUsername(), "VAULT_DOCUMENT_ACCESSED", "VaultDocument", String.valueOf(documentId),
                    "owner " + d.getOwner().getUsername());
        }
        return new Download(d.getStoredDocument(), storage.loadAsResource(d.getStoredDocument()));
    }

    @Transactional
    public void delete(Long documentId, User actor) {
        VaultDocument d = find(documentId);
        vault.delete(d);
        storage.delete(d.getStoredDocument());
        audit.record(actor.getUsername(), "VAULT_DOCUMENT_DELETED", "VaultDocument", String.valueOf(documentId),
                d.getCategory() + " for " + d.getOwner().getUsername());
    }

    private VaultDocument find(Long id) {
        return vault.findById(id).orElseThrow(() -> new NoSuchElementException("Document not found"));
    }

    private static void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a file to upload");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Files must be 10MB or smaller");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        int dot = name.lastIndexOf('.');
        String ext = dot < 0 ? "" : name.substring(dot + 1);
        List<String> types = ALLOWED.get(ext);
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (types == null || !types.contains(type)) {
            throw new IllegalArgumentException("Only PDF, PNG, JPG and Word documents are allowed");
        }
    }
}
