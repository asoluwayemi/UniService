package com.uniservice.staff.repository;

import com.uniservice.staff.entity.AcademicQualification;
import com.uniservice.staff.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicQualificationRepository extends JpaRepository<AcademicQualification, Long> {

    List<AcademicQualification> findByStaffProfile(StaffProfile staffProfile);
}
