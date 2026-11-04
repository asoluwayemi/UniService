package com.uniservice.analytics.service;

import com.uniservice.analytics.dto.AnalyticsResponse;
import com.uniservice.attendance.repository.AttendanceRecordRepository;
import com.uniservice.core.common.DayCount;
import com.uniservice.core.common.LabelCount;
import com.uniservice.leave.repository.LeaveRequestRepository;
import com.uniservice.onboarding.repository.OnboardingCaseRepository;
import com.uniservice.payroll.entity.PayrollRun;
import com.uniservice.payroll.entity.PayrollRunStatus;
import com.uniservice.payroll.repository.PayrollRunRepository;
import com.uniservice.recruitment.entity.PostingStatus;
import com.uniservice.recruitment.repository.JobApplicationRepository;
import com.uniservice.recruitment.repository.JobPostingRepository;
import com.uniservice.staff.repository.StaffProfileRepository;
import com.uniservice.vault.repository.VaultDocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2027, 3, 10);

    @Mock private StaffProfileRepository staff;
    @Mock private LeaveRequestRepository leave;
    @Mock private JobPostingRepository postings;
    @Mock private JobApplicationRepository applications;
    @Mock private PayrollRunRepository payroll;
    @Mock private AttendanceRecordRepository attendance;
    @Mock private VaultDocumentRepository vault;
    @Mock private OnboardingCaseRepository onboarding;

    private AnalyticsService service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(TODAY.atTime(12, 0).toInstant(ZoneOffset.UTC), ZoneOffset.UTC);
        service = new AnalyticsService(staff, leave, postings, applications, payroll, attendance, vault, onboarding, clock);
    }

    private static LabelCount lc(String label, long total) {
        return new LabelCount() {
            public String getLabel() { return label; }
            public long getTotal() { return total; }
        };
    }

    private static DayCount dc(LocalDate day, long total, Long late) {
        return new DayCount() {
            public LocalDate getDay() { return day; }
            public long getTotal() { return total; }
            public Long getLate() { return late; }
        };
    }

    private void stubCore() {
        when(staff.countByEmploymentStatus()).thenReturn(List.of(lc("ACTIVE", 40), lc("SEPARATED", 2)));
        when(staff.countByCategory()).thenReturn(List.of(lc("ACADEMIC", 25), lc("NON_ACADEMIC", 17)));
        when(staff.countByOrgUnit(any(Pageable.class))).thenReturn(List.of(lc("Physics", 9), lc("Unassigned", 3)));
        when(leave.countByStatus()).thenReturn(List.of(lc("PENDING", 4), lc("APPROVED", 10)));
    }

    @Test
    void withOnlyAnalyticsView_returnsStaffAndLeave_andNothingSensitive() {
        stubCore();

        AnalyticsResponse r = service.build(Set.of("ANALYTICS_VIEW"));

        assertThat(r.staff().total()).isEqualTo(42);
        assertThat(r.staff().active()).isEqualTo(40);
        assertThat(r.leave().pending()).isEqualTo(4);
        assertThat(r.recruitment()).isNull();
        assertThat(r.payroll()).isNull();
        assertThat(r.attendance()).isNull();
        assertThat(r.expiringDocuments()).isNull();
        assertThat(r.onboardingInProgress()).isNull();
        verifyNoInteractions(payroll, attendance, applications, postings, vault, onboarding);
    }

    @Test
    void buckets_areZeroFilledInEnumOrder() {
        stubCore();

        AnalyticsResponse r = service.build(Set.of());

        assertThat(r.staff().byStatus()).extracting(AnalyticsResponse.Bucket::label)
                .containsExactly("ACTIVE", "ON_LEAVE", "SUSPENDED", "SEPARATED");
        assertThat(r.staff().byStatus()).extracting(AnalyticsResponse.Bucket::value).containsExactly(40L, 0L, 0L, 2L);
        assertThat(r.leave().byStatus()).extracting(AnalyticsResponse.Bucket::label)
                .containsExactly("PENDING", "APPROVED", "REJECTED", "CANCELLED");
        assertThat(r.staff().byDepartment()).hasSize(2);
    }

    @Test
    void recruitment_onlyWithItsPermission() {
        stubCore();
        when(postings.countByStatus(PostingStatus.OPEN)).thenReturn(3L);
        when(applications.countByStage()).thenReturn(List.of(lc("APPLIED", 12), lc("HIRED", 1)));

        AnalyticsResponse r = service.build(Set.of("RECRUITMENT_MANAGE"));

        assertThat(r.recruitment().openPostings()).isEqualTo(3);
        assertThat(r.recruitment().pipeline()).hasSize(6);
        assertThat(r.recruitment().pipeline().get(0).label()).isEqualTo("APPLIED");
        assertThat(r.recruitment().pipeline().get(0).value()).isEqualTo(12);
    }

    @Test
    void payroll_isOldestFirst_publishedOnly() {
        stubCore();
        PayrollRun newer = PayrollRun.builder().period("2027-02").staffCount(40).totalGross(new BigDecimal("500")).totalNet(new BigDecimal("400")).build();
        PayrollRun older = PayrollRun.builder().period("2027-01").staffCount(39).totalGross(new BigDecimal("480")).totalNet(new BigDecimal("390")).build();
        when(payroll.findTop6ByStatusOrderByPeriodDesc(PayrollRunStatus.PUBLISHED)).thenReturn(List.of(newer, older));

        AnalyticsResponse r = service.build(Set.of("PAYROLL_MANAGE"));

        assertThat(r.payroll().history()).extracting(AnalyticsResponse.PayrollPoint::period).containsExactly("2027-01", "2027-02");
    }

    @Test
    void attendance_fillsMissingDays_andReportsToday() {
        stubCore();
        when(attendance.countByDay(TODAY.minusDays(13), TODAY)).thenReturn(List.of(
                dc(TODAY.minusDays(1), 30, 5L), dc(TODAY, 36, null)));

        AnalyticsResponse r = service.build(Set.of("ATTENDANCE_VIEW_ALL"));

        assertThat(r.attendance().last14Days()).hasSize(14);
        assertThat(r.attendance().last14Days().get(0).date()).isEqualTo(TODAY.minusDays(13));
        assertThat(r.attendance().last14Days().get(0).present()).isZero();
        assertThat(r.attendance().presentToday()).isEqualTo(36);
        assertThat(r.attendance().lateToday()).isZero();
        assertThat(r.attendance().activeStaff()).isEqualTo(40);
        assertThat(r.attendance().last14Days().get(12).late()).isEqualTo(5);
    }

    @Test
    void vaultAndOnboardingCounts_followTheirPermissions() {
        stubCore();
        when(vault.countByExpiresOnBetween(TODAY, TODAY.plusDays(60))).thenReturn(7L);
        when(onboarding.countByStatus(any())).thenReturn(2L);

        AnalyticsResponse r = service.build(Set.of("VAULT_MANAGE", "ONBOARDING_MANAGE"));

        assertThat(r.expiringDocuments().value()).isEqualTo(7);
        assertThat(r.onboardingInProgress().value()).isEqualTo(2);
    }
}
