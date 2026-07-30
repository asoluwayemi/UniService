package com.uniservice.core.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    private String createdBy;
    private String updatedBy;
}
