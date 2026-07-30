package com.uniservice.appraisal.repository;

import com.uniservice.appraisal.entity.AppraisalCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppraisalCycleRepository extends JpaRepository<AppraisalCycle, Long> {

    Optional<AppraisalCycle> findByYear(Integer year);

    List<AppraisalCycle> findAllByOrderByYearDesc();
}
