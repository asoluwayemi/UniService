package com.uniservice.analytics.service;

import com.uniservice.analytics.dto.AnalyticsResponse;
import com.uniservice.analytics.dto.AnalyticsResponse.*;
import com.uniservice.attendance.repository.AttendanceRecordRepository;
import com.uniservice.core.common.DayCount;
import com.uniservice.core.common.LabelCount;
import com.uniservice.leave.entity.LeaveStatus;
import com.uniservice.leave.repository.LeaveRequestRepository;
import com.uniservice.onboarding.entity.OnboardingStatus;
import com.uniservice.onboarding.repository.OnboardingCaseRepository;
import com.uniservice.payroll.entity.PayrollRun;
import com.uniservice.payroll.entity.PayrollRunStatus;
import com.uniservice.payroll.repository.PayrollRunRepository;
import com.uniservice.recruitment.entity.ApplicationStage;
import com.uniservice.recruitment.entity.PostingStatus;
import com.uniservice.recruitment.repository.JobApplicationRepository;
import com.uniservice.recruitment.repository.JobPostingRepository;
import com.uniservice.staff.entity.EmploymentStatus;
import com.uniservice.staff.entity.StaffCategory;
import com.uniservice.staff.repository.StaffProfileRepository;
import com.uniservice.vault.repository.VaultDocumentRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    static final int TOP_DEPARTMENTS = 8;
    static final int ATTENDANCE_DAYS = 14;
    static final int EXPIRY_WINDOW_DAYS = 60;

    private final StaffProfileRepository staff;
    private final LeaveRequestRepository leave;
    private final JobPostingRepository postings;
    private final JobApplicationRepository applications;
    private final PayrollRunRepository payroll;
    private final AttendanceRecordRepository attendance;
    private final VaultDocumentRepository vault;
    private final OnboardingCaseRepository onboarding;
    private final Clock clock;

    public AnalyticsService(StaffProfileRepository staff, LeaveRequestRepository leave, JobPostingRepository postings,
                            JobApplicationRepository applications, PayrollRunRepository payroll,
                            AttendanceRecordRepository attendance, VaultDocumentRepository vault,
                            OnboardingCaseRepository onboarding, Clock clock) {
        this.staff = staff;
        this.leave = leave;
        this.postings = postings;
        this.applications = applications;
        this.payroll = payroll;
        this.attendance = attendance;
        this.vault = vault;
        this.onboarding = onboarding;
        this.clock = clock;
    }

    /** @param authorities the caller's granted authorities; they decide which optional sections are filled. */
    @Transactional(readOnly = true)
    public AnalyticsResponse build(Set<String> authorities) {
        LocalDate today = LocalDate.now(clock);

        List<Bucket> byStatus = fill(staff.countByEmploymentStatus(), names(EmploymentStatus.values()));
        long active = value(byStatus, EmploymentStatus.ACTIVE.name());
        StaffSection staffSection = new StaffSection(
                byStatus.stream().mapToLong(Bucket::value).sum(), active,
                fill(staff.countByCategory(), names(StaffCategory.values())), byStatus,
                staff.countByOrgUnit(PageRequest.of(0, TOP_DEPARTMENTS)).stream()
                        .map(l -> new Bucket(l.getLabel(), l.getTotal())).toList());

        List<Bucket> leaveStatus = fill(leave.countByStatus(), names(LeaveStatus.values()));
        LeaveSection leaveSection = new LeaveSection(value(leaveStatus, LeaveStatus.PENDING.name()), leaveStatus);

        RecruitmentSection recruitment = authorities.contains("RECRUITMENT_MANAGE")
                ? new RecruitmentSection(postings.countByStatus(PostingStatus.OPEN),
                fill(applications.countByStage(), names(ApplicationStage.values())))
                : null;

        PayrollSection payrollSection = authorities.contains("PAYROLL_MANAGE") ? payrollHistory() : null;

        AttendanceSection attendanceSection = authorities.contains("ATTENDANCE_VIEW_ALL")
                ? attendance(today, active) : null;

        CountSection expiring = authorities.contains("VAULT_MANAGE")
                ? new CountSection(vault.countByExpiresOnBetween(today, today.plusDays(EXPIRY_WINDOW_DAYS))) : null;
        CountSection onboardingOpen = authorities.contains("ONBOARDING_MANAGE")
                ? new CountSection(onboarding.countByStatus(OnboardingStatus.IN_PROGRESS)) : null;

        return new AnalyticsResponse(Instant.now(clock), staffSection, leaveSection, recruitment, payrollSection,
                attendanceSection, expiring, onboardingOpen);
    }

    private PayrollSection payrollHistory() {
        List<PayrollRun> runs = new ArrayList<>(payroll.findTop6ByStatusOrderByPeriodDesc(PayrollRunStatus.PUBLISHED));
        Collections.reverse(runs);
        return new PayrollSection(runs.stream()
                .map(r -> new PayrollPoint(r.getPeriod(), r.getTotalGross(), r.getTotalNet(), r.getStaffCount())).toList());
    }

    private AttendanceSection attendance(LocalDate today, long activeStaff) {
        LocalDate from = today.minusDays(ATTENDANCE_DAYS - 1L);
        Map<LocalDate, DayCount> byDay = attendance.countByDay(from, today).stream()
                .collect(Collectors.toMap(DayCount::getDay, d -> d, (a, b) -> a));
        List<AttendanceDay> days = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) {
            DayCount c = byDay.get(d);
            days.add(new AttendanceDay(d, c == null ? 0 : c.getTotal(), c == null || c.getLate() == null ? 0 : c.getLate()));
        }
        AttendanceDay last = days.get(days.size() - 1);
        return new AttendanceSection(activeStaff, last.present(), last.late(), days);
    }

    /** Returns one bucket per expected label, in the given order, with zero for labels the query did not return. */
    private static List<Bucket> fill(List<LabelCount> rows, List<String> order) {
        Map<String, Long> counts = new HashMap<>();
        rows.forEach(r -> counts.merge(r.getLabel(), r.getTotal(), Long::sum));
        return order.stream().map(l -> new Bucket(l, counts.getOrDefault(l, 0L))).toList();
    }

    private static long value(List<Bucket> buckets, String label) {
        return buckets.stream().filter(b -> b.label().equals(label)).mapToLong(Bucket::value).findFirst().orElse(0);
    }

    private static List<String> names(Enum<?>[] values) {
        return Arrays.stream(values).map(Enum::name).toList();
    }
}
