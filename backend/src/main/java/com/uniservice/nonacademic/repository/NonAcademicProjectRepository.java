package com.uniservice.nonacademic.repository;

import com.uniservice.nonacademic.entity.NonAcademicProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NonAcademicProjectRepository extends JpaRepository<NonAcademicProject, Long> {
    List<NonAcademicProject> findByStaffProfileIdOrderByIdDesc(Long staffProfileId);
}
