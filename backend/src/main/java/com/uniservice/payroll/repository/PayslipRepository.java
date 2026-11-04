package com.uniservice.payroll.repository;

import com.uniservice.auth.entity.User;
import com.uniservice.payroll.entity.PayrollRun;
import com.uniservice.payroll.entity.PayrollRunStatus;
import com.uniservice.payroll.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayslipRepository extends JpaRepository<Payslip, Long> {
    List<Payslip> findByRunOrderByFullNameAsc(PayrollRun run);

    void deleteByRun(PayrollRun run);

    List<Payslip> findByUserAndRunStatusOrderByRunPeriodDesc(User user, PayrollRunStatus status);
}
