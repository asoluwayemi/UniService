package com.uniservice.payroll.repository;

import com.uniservice.payroll.entity.SalaryScale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SalaryScaleRepository extends JpaRepository<SalaryScale, Long> {
    Optional<SalaryScale> findByGradeLevel(int gradeLevel);
}
