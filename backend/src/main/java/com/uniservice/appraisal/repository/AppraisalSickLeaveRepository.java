package com.uniservice.appraisal.repository;

import com.uniservice.appraisal.entity.AppraisalForm;
import com.uniservice.appraisal.entity.AppraisalSickLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppraisalSickLeaveRepository extends JpaRepository<AppraisalSickLeave, Long> {

    List<AppraisalSickLeave> findByAppraisalForm(AppraisalForm appraisalForm);
}
