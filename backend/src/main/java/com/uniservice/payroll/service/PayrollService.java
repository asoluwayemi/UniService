package com.uniservice.payroll.service;

import com.uniservice.audit.service.AuditService;
import com.uniservice.auth.entity.User;
import com.uniservice.notification.service.NotificationService;
import com.uniservice.payroll.dto.PayrollRunResponse;
import com.uniservice.payroll.dto.PayslipResponse;
import com.uniservice.payroll.entity.PayrollRun;
import com.uniservice.payroll.entity.PayrollRunStatus;
import com.uniservice.payroll.entity.Payslip;
import com.uniservice.payroll.repository.PayrollRunRepository;
import com.uniservice.payroll.repository.PayslipRepository;
import com.uniservice.payroll.repository.SalaryScaleRepository;
import com.uniservice.staff.entity.EmploymentStatus;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.StaffProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class PayrollService {

    private final PayrollRunRepository runs;
    private final PayslipRepository payslips;
    private final SalaryScaleRepository scales;
    private final StaffProfileRepository staff;
    private final PayrollCalculator calculator;
    private final NotificationService notifications;
    private final AuditService audit;
    private final Clock clock;

    public PayrollService(PayrollRunRepository runs, PayslipRepository payslips, SalaryScaleRepository scales,
                          StaffProfileRepository staff, PayrollCalculator calculator,
                          NotificationService notifications, AuditService audit, Clock clock) {
        this.runs = runs;
        this.payslips = payslips;
        this.scales = scales;
        this.staff = staff;
        this.calculator = calculator;
        this.notifications = notifications;
        this.audit = audit;
        this.clock = clock;
    }

    /** Generates (or regenerates) the DRAFT run for a period. A PUBLISHED run is immutable. */
    @Transactional
    public PayrollRunResponse generate(String period, User actor) {
        PayrollRun run = runs.findByPeriod(period).orElseGet(() -> PayrollRun.builder().period(period).build());
        if (run.getStatus() == PayrollRunStatus.PUBLISHED) {
            throw new IllegalArgumentException("Payroll for " + period + " is already published");
        }
        if (run.getId() == null) {
            run = runs.save(run);
        } else {
            payslips.deleteByRun(run);
            payslips.flush();
        }

        int count = 0;
        int skipped = 0;
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal net = BigDecimal.ZERO;
        for (StaffProfile p : staff.findAll()) {
            if (!isPaid(p.getEmploymentStatus()) || p.getUser() == null) {
                continue;
            }
            var scale = p.getGradeLevel() == null ? null : scales.findByGradeLevel(p.getGradeLevel()).orElse(null);
            if (scale == null) {
                skipped++;
                continue;
            }
            PayrollCalculator.Breakdown b = calculator.calculate(scale.getBasicMonthly());
            payslips.save(Payslip.builder()
                    .run(run).user(p.getUser()).staffNumber(p.getStaffNumber())
                    .fullName((p.getUser().getFirstName() + " " + p.getUser().getLastName()).trim())
                    .gradeLevel(p.getGradeLevel())
                    .basic(b.basic()).housing(b.housing()).transport(b.transport()).gross(b.gross())
                    .pension(b.pension()).tax(b.tax()).net(b.net())
                    .bankName(p.getBankName()).accountLast4(last4(p.getBankAccountNumber()))
                    .build());
            count++;
            gross = gross.add(b.gross());
            net = net.add(b.net());
        }

        run.setStaffCount(count);
        run.setSkippedCount(skipped);
        run.setTotalGross(gross);
        run.setTotalNet(net);
        run.setGeneratedBy(actor.getUsername());
        PayrollRun saved = runs.save(run);
        audit.record(actor.getUsername(), "PAYROLL_GENERATED", "PayrollRun", String.valueOf(saved.getId()),
                period + ": " + count + " payslips, " + skipped + " skipped");
        return PayrollRunResponse.from(saved);
    }

    @Transactional
    public PayrollRunResponse publish(Long runId, User actor) {
        PayrollRun run = runs.findById(runId).orElseThrow(() -> new NoSuchElementException("Payroll run not found"));
        if (run.getStatus() == PayrollRunStatus.PUBLISHED) {
            throw new IllegalArgumentException("Payroll for " + run.getPeriod() + " is already published");
        }
        if (run.getStaffCount() == 0) {
            throw new IllegalArgumentException("Cannot publish an empty payroll run");
        }
        run.setStatus(PayrollRunStatus.PUBLISHED);
        run.setPublishedAt(Instant.now(clock));
        PayrollRun saved = runs.save(run);
        for (Payslip p : payslips.findByRunOrderByFullNameAsc(saved)) {
            notifications.notify(p.getUser(), "Your payslip for " + saved.getPeriod() + " is available.", "/payslips");
        }
        audit.record(actor.getUsername(), "PAYROLL_PUBLISHED", "PayrollRun", String.valueOf(saved.getId()), saved.getPeriod());
        return PayrollRunResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<PayrollRunResponse> listRuns() {
        return runs.findAllByOrderByPeriodDesc().stream().map(PayrollRunResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PayslipResponse> payslipsForRun(Long runId) {
        PayrollRun run = runs.findById(runId).orElseThrow(() -> new NoSuchElementException("Payroll run not found"));
        return payslips.findByRunOrderByFullNameAsc(run).stream().map(PayslipResponse::from).toList();
    }

    /** Only published payslips are visible to staff. */
    @Transactional(readOnly = true)
    public List<PayslipResponse> mine(User user) {
        return payslips.findByUserAndRunStatusOrderByRunPeriodDesc(user, PayrollRunStatus.PUBLISHED).stream()
                .map(PayslipResponse::from).toList();
    }

    /** Staff on approved leave are still paid; suspended and separated staff are not (policy: confirm with Finance/HR). */
    private static boolean isPaid(EmploymentStatus s) {
        return s == EmploymentStatus.ACTIVE || s == EmploymentStatus.ON_LEAVE;
    }

    private static String last4(String account) {
        if (account == null) return null;
        String digits = account.replaceAll("\\D", "");
        return digits.isEmpty() ? null : digits.substring(Math.max(0, digits.length() - 4));
    }
}
