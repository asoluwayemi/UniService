package com.uniservice.vault.entity;

import com.uniservice.auth.entity.User;
import com.uniservice.core.common.BaseEntity;
import com.uniservice.storage.entity.StoredDocument;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "vault_documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VaultDocument extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stored_document_id", nullable = false)
    private StoredDocument storedDocument;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VaultCategory category;

    @Column(nullable = false, length = 200) private String title;
    @Column(length = 1000) private String description;
    @Column(name = "expires_on") private LocalDate expiresOn;

    /** When false the record is HR-only and the staff member cannot see or download it. */
    @Column(name = "visible_to_owner", nullable = false)
    @Builder.Default
    private boolean visibleToOwner = true;
}
