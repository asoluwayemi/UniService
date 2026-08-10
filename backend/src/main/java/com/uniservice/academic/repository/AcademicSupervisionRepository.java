package com.uniservice.academic.repository;

import com.uniservice.academic.entity.AcademicSupervision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicSupervisionRepository extends JpaRepository<AcademicSupervision, Long> {
    List<AcademicSupervision> findByStaffProfileIdOrderByIdDesc(Long staffProfileId);
}
