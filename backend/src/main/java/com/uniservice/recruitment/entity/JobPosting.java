package com.uniservice.recruitment.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "job_postings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobPosting extends BaseEntity {
    @Column(nullable = false, length = 200) private String title;
    @Column(nullable = false, length = 200) private String department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostingCategory category;

    @Column(nullable = false, length = 4000) private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PostingStatus status = PostingStatus.DRAFT;

    @Column(name = "closing_date") private LocalDate closingDate;
}
