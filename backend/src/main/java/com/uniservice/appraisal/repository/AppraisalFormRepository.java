package com.uniservice.appraisal.repository;

import com.uniservice.appraisal.entity.AppraisalCycle;
import com.uniservice.appraisal.entity.AppraisalForm;
import com.uniservice.appraisal.entity.AppraisalStatus;
import com.uniservice.staff.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppraisalFormRepository extends JpaRepository<AppraisalForm, Long> {

    Optional<AppraisalForm> findByCycleAndStaffProfile(AppraisalCycle cycle, StaffProfile staffProfile);

    List<AppraisalForm> findByStaffProfileOrderByCreatedAtDesc(StaffProfile staffProfile);

    List<AppraisalForm> findByStaffProfileAndStatus(StaffProfile staffProfile, AppraisalStatus status);

    List<AppraisalForm> findByStatus(AppraisalStatus status);
}
