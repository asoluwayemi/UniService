package com.uniservice.payroll.repository;

import com.uniservice.payroll.entity.PayrollRunStatus;
import com.uniservice.payroll.entity.PayrollRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayrollRunRepository extends JpaRepository<PayrollRun, Long> {
    Optional<PayrollRun> findByPeriod(String period);

    List<PayrollRun> findAllByOrderByPeriodDesc();

    List<PayrollRun> findTop6ByStatusOrderByPeriodDesc(PayrollRunStatus status);
}
