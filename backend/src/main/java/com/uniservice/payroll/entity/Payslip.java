package com.uniservice.payroll.entity;

import com.uniservice.auth.entity.User;
import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "payslips")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payslip extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    private PayrollRun run;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "staff_number") private String staffNumber;
    @Column(name = "full_name", nullable = false) private String fullName;
    @Column(name = "grade_level", nullable = false) private int gradeLevel;
    @Column(nullable = false) private BigDecimal basic;
    @Column(nullable = false) private BigDecimal housing;
    @Column(nullable = false) private BigDecimal transport;
    @Column(nullable = false) private BigDecimal gross;
    @Column(nullable = false) private BigDecimal pension;
    @Column(nullable = false) private BigDecimal tax;
    @Column(nullable = false) private BigDecimal net;
    @Column(name = "bank_name") private String bankName;
    @Column(name = "account_last4", length = 4) private String accountLast4;
}
