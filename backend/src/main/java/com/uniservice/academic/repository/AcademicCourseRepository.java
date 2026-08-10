package com.uniservice.academic.repository;

import com.uniservice.academic.entity.AcademicCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicCourseRepository extends JpaRepository<AcademicCourse, Long> {
    List<AcademicCourse> findByStaffProfileIdOrderByIdDesc(Long staffProfileId);
}
