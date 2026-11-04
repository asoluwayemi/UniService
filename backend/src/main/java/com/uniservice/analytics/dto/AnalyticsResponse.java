package com.uniservice.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Dashboard payload. {@code staff} and {@code leave} are always present; every other section is null unless the
 * caller also holds that module's own permission, so analytics never widens access to payroll or HR data.
 */
public record AnalyticsResponse(Instant generatedAt, StaffSection staff, LeaveSection leave,
                                RecruitmentSection recruitment, PayrollSection payroll,
                                AttendanceSection attendance, CountSection expiringDocuments,
                                CountSection onboardingInProgress) {

    public record Bucket(String label, long value) {
    }

    public record StaffSection(long total, long active, List<Bucket> byCategory, List<Bucket> byStatus,
                               List<Bucket> byDepartment) {
    }

    public record LeaveSection(long pending, List<Bucket> byStatus) {
    }

    public record RecruitmentSection(long openPostings, List<Bucket> pipeline) {
    }

    public record PayrollPoint(String period, BigDecimal totalGross, BigDecimal totalNet, int staffCount) {
    }

    /** Oldest first, so a chart reads left to right in time. */
    public record PayrollSection(List<PayrollPoint> history) {
    }

    public record AttendanceDay(LocalDate date, long present, long late) {
    }

    public record AttendanceSection(long activeStaff, long presentToday, long lateToday, List<AttendanceDay> last14Days) {
    }

    public record CountSection(long value) {
    }
}
