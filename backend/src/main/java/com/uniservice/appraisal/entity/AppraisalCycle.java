package com.uniservice.appraisal.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "appraisal_cycles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppraisalCycle extends BaseEntity {

    @Column(nullable = false, unique = true)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AppraisalCycleStatus status = AppraisalCycleStatus.OPEN;
}
