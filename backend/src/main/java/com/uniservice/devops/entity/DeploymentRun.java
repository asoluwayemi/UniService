package com.uniservice.devops.entity;

import com.uniservice.auth.entity.User;
import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "deployment_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeploymentRun extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "run_type", nullable = false, length = 20)
    private DeploymentRunType runType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeploymentRunStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "triggered_by", nullable = false)
    private User triggeredBy;

    @Column(columnDefinition = "TEXT")
    private String output;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;
}
