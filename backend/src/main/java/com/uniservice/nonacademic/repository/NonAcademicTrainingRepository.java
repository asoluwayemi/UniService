package com.uniservice.nonacademic.repository;

import com.uniservice.nonacademic.entity.NonAcademicTraining;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NonAcademicTrainingRepository extends JpaRepository<NonAcademicTraining, Long> {
    List<NonAcademicTraining> findByStaffProfileIdOrderByIdDesc(Long staffProfileId);
}
