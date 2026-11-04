package com.uniservice.payroll.dto;

import com.uniservice.payroll.entity.PayrollRun;
import com.uniservice.payroll.entity.PayrollRunStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record PayrollRunResponse(Long id, String period, PayrollRunStatus status, int staffCount, int skippedCount,
                                 BigDecimal totalGross, BigDecimal totalNet, String generatedBy, Instant publishedAt) {
    public static PayrollRunResponse from(PayrollRun r) {
        return new PayrollRunResponse(r.getId(), r.getPeriod(), r.getStatus(), r.getStaffCount(), r.getSkippedCount(),
                r.getTotalGross(), r.getTotalNet(), r.getGeneratedBy(), r.getPublishedAt());
    }
}
