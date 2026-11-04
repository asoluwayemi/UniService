package com.uniservice.payroll.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "salary_scales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SalaryScale extends BaseEntity {
    @Column(name = "grade_level", nullable = false, unique = true)
    private int gradeLevel;

    @Column(name = "basic_monthly", nullable = false)
    private BigDecimal basicMonthly;
}
