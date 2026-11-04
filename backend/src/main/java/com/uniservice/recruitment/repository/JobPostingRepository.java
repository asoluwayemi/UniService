package com.uniservice.recruitment.repository;

import com.uniservice.recruitment.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findAllByOrderByCreatedAtDesc();
}
