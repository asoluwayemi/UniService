package com.uniservice.payroll.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payroll_runs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PayrollRun extends BaseEntity {
    /** yyyy-MM */
    @Column(nullable = false, unique = true, length = 7)
    private String period;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PayrollRunStatus status = PayrollRunStatus.DRAFT;

    @Column(name = "staff_count", nullable = false)
    private int staffCount;

    @Column(name = "skipped_count", nullable = false)
    private int skippedCount;

    @Column(name = "total_gross", nullable = false)
    @Builder.Default
    private BigDecimal totalGross = BigDecimal.ZERO;

    @Column(name = "total_net", nullable = false)
    @Builder.Default
    private BigDecimal totalNet = BigDecimal.ZERO;

    @Column(name = "generated_by")
    private String generatedBy;

    @Column(name = "published_at")
    private Instant publishedAt;
}
