package com.uniservice.payroll.service;

import com.uniservice.audit.service.AuditService;
import com.uniservice.auth.entity.User;
import com.uniservice.notification.service.NotificationService;
import com.uniservice.payroll.dto.PayrollRunResponse;
import com.uniservice.payroll.entity.PayrollRun;
import com.uniservice.payroll.entity.PayrollRunStatus;
import com.uniservice.payroll.entity.Payslip;
import com.uniservice.payroll.entity.SalaryScale;
import com.uniservice.payroll.repository.PayrollRunRepository;
import com.uniservice.payroll.repository.PayslipRepository;
import com.uniservice.payroll.repository.SalaryScaleRepository;
import com.uniservice.staff.entity.EmploymentStatus;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.StaffProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayrollServiceTest {

    @Mock private PayrollRunRepository runs;
    @Mock private PayslipRepository payslips;
    @Mock private SalaryScaleRepository scales;
    @Mock private StaffProfileRepository staff;
    @Mock private NotificationService notifications;
    @Mock private AuditService audit;

    private PayrollService service;
    private User finance;

    @BeforeEach
    void setUp() {
        PayrollCalculator calculator = new PayrollCalculator(
                new BigDecimal("0.25"), new BigDecimal("0.15"), new BigDecimal("0.08"), new BigDecimal("0.07"));
        service = new PayrollService(runs, payslips, scales, staff, calculator, notifications, audit, Clock.systemUTC());
        finance = new User();
        finance.setId(99L);
        finance.setUsername("finance");
    }

    private StaffProfile profile(long id, String first, Integer grade, EmploymentStatus status, String account) {
        User u = new User();
        u.setId(id);
        u.setFirstName(first);
        u.setLastName("Doe");
        StaffProfile p = new StaffProfile();
        p.setUser(u);
        p.setGradeLevel(grade);
        p.setEmploymentStatus(status);
        p.setStaffNumber("S" + id);
        p.setBankAccountNumber(account);
        return p;
    }

    private void stubNewRun() {
        when(runs.findByPeriod("2027-03")).thenReturn(Optional.empty());
        when(runs.save(any(PayrollRun.class))).thenAnswer(i -> {
            PayrollRun r = i.getArgument(0);
            if (r.getId() == null) r.setId(5L);
            return r;
        });
    }

    @Test
    void generate_createsPayslipsForActiveGradedStaff_andSkipsTheRest() {
        stubNewRun();
        when(staff.findAll()).thenReturn(List.of(
                profile(1, "Ada", 10, EmploymentStatus.ACTIVE, "0123-456-789"),
                profile(2, "Bob", null, EmploymentStatus.ACTIVE, null),
                profile(5, "Eve", 10, EmploymentStatus.ON_LEAVE, null),
                profile(3, "Cy", 10, EmploymentStatus.SEPARATED, null),
                profile(4, "Di", 10, EmploymentStatus.SUSPENDED, null)));
        when(scales.findByGradeLevel(10)).thenReturn(Optional.of(new SalaryScale(10, new BigDecimal("100000"))));

        PayrollRunResponse r = service.generate("2027-03", finance);

        assertThat(r.staffCount()).isEqualTo(2);
        assertThat(r.skippedCount()).isEqualTo(1);
        assertThat(r.totalGross()).isEqualByComparingTo("280000.00");
        assertThat(r.totalNet()).isEqualByComparingTo("244400.00");
        assertThat(r.status()).isEqualTo(PayrollRunStatus.DRAFT);

        ArgumentCaptor<Payslip> slip = ArgumentCaptor.forClass(Payslip.class);
        verify(payslips, times(2)).save(slip.capture());
        Payslip first = slip.getAllValues().get(0);
        assertThat(first.getAccountLast4()).isEqualTo("6789");
        assertThat(first.getFullName()).isEqualTo("Ada Doe");
        verify(audit).record(eq("finance"), eq("PAYROLL_GENERATED"), eq("PayrollRun"), eq("5"), any());
    }

    @Test
    void generate_regeneratesDraftByClearingOldPayslips() {
        PayrollRun draft = PayrollRun.builder().period("2027-03").build();
        draft.setId(5L);
        when(runs.findByPeriod("2027-03")).thenReturn(Optional.of(draft));
        when(runs.save(any(PayrollRun.class))).thenAnswer(i -> i.getArgument(0));
        when(staff.findAll()).thenReturn(List.of());

        service.generate("2027-03", finance);

        verify(payslips).deleteByRun(draft);
    }

    @Test
    void generate_rejectsPublishedPeriod() {
        PayrollRun published = PayrollRun.builder().period("2027-03").status(PayrollRunStatus.PUBLISHED).build();
        when(runs.findByPeriod("2027-03")).thenReturn(Optional.of(published));

        assertThatThrownBy(() -> service.generate("2027-03", finance))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("already published");
        verify(payslips, never()).save(any());
    }

    @Test
    void publish_marksPublished_andNotifiesEachStaffMember() {
        PayrollRun run = PayrollRun.builder().period("2027-03").staffCount(1).build();
        run.setId(5L);
        Payslip slip = Payslip.builder().run(run).user(profile(1, "Ada", 10, EmploymentStatus.ACTIVE, null).getUser()).build();
        when(runs.findById(5L)).thenReturn(Optional.of(run));
        when(runs.save(any(PayrollRun.class))).thenAnswer(i -> i.getArgument(0));
        when(payslips.findByRunOrderByFullNameAsc(run)).thenReturn(List.of(slip));

        PayrollRunResponse r = service.publish(5L, finance);

        assertThat(r.status()).isEqualTo(PayrollRunStatus.PUBLISHED);
        assertThat(r.publishedAt()).isNotNull();
        verify(notifications).notify(eq(slip.getUser()), contains("2027-03"), any());
    }

    @Test
    void publish_rejectsEmptyAndAlreadyPublishedRuns() {
        PayrollRun empty = PayrollRun.builder().period("2027-03").build();
        PayrollRun done = PayrollRun.builder().period("2027-02").staffCount(2).status(PayrollRunStatus.PUBLISHED).build();
        when(runs.findById(1L)).thenReturn(Optional.of(empty));
        when(runs.findById(2L)).thenReturn(Optional.of(done));

        assertThatThrownBy(() -> service.publish(1L, finance)).hasMessageContaining("empty");
        assertThatThrownBy(() -> service.publish(2L, finance)).hasMessageContaining("already published");
        verify(notifications, never()).notify(any(), any(), any());
    }

    @Test
    void publish_unknownRun_throwsNotFound() {
        when(runs.findById(7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.publish(7L, finance)).isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void mine_onlyQueriesPublishedPayslips() {
        when(payslips.findByUserAndRunStatusOrderByRunPeriodDesc(finance, PayrollRunStatus.PUBLISHED)).thenReturn(List.of());

        assertThat(service.mine(finance)).isEmpty();
        verify(payslips).findByUserAndRunStatusOrderByRunPeriodDesc(finance, PayrollRunStatus.PUBLISHED);
    }
}
