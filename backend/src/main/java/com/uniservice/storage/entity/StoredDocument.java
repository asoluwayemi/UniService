package com.uniservice.storage.entity;

import com.uniservice.auth.entity.User;
import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "stored_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoredDocument extends BaseEntity {

    @Column(name = "storage_key", nullable = false, unique = true, length = 64)
    private String storageKey;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "content_type", length = 150)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by_user_id", nullable = false)
    private User uploadedBy;
}
