package com.uniservice.onboarding.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "onboarding_tasks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OnboardingTask extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false)
    private OnboardingCase onboardingCase;

    @Column(name = "sort_order", nullable = false) private int sortOrder;
    @Column(nullable = false, length = 250) private String title;
    @Column(name = "owner_team", nullable = false, length = 30) private String ownerTeam;
    @Column(nullable = false) private boolean done;
    @Column(name = "done_at") private Instant doneAt;
    @Column(name = "done_by") private String doneBy;
}
