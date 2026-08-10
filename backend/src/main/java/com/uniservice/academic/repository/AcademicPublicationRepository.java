package com.uniservice.academic.repository;

import com.uniservice.academic.entity.AcademicPublication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicPublicationRepository extends JpaRepository<AcademicPublication, Long> {
    List<AcademicPublication> findByStaffProfileIdOrderByIdDesc(Long staffProfileId);
}
