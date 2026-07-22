package com.uniservice.core.common;

import jakarta.persistence.*;
import java.time.Instant;

@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    private String createdBy;
    private String updatedBy;
}
