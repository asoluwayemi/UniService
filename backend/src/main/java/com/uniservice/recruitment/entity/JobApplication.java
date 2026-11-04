package com.uniservice.recruitment.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "job_applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobApplication extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "posting_id", nullable = false)
    private JobPosting posting;

    @Column(name = "applicant_name", nullable = false, length = 200) private String applicantName;
    @Column(nullable = false) private String email;
    @Column(length = 40) private String phone;
    @Column(name = "cover_note", length = 2000) private String coverNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ApplicationStage stage = ApplicationStage.APPLIED;

    @Column(name = "stage_note", length = 1000) private String stageNote;
    @Column(name = "applied_at", nullable = false) private Instant appliedAt;
}
