package com.uniservice.recruitment.repository;

import com.uniservice.recruitment.entity.JobApplication;
import com.uniservice.recruitment.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByPostingOrderByAppliedAtDesc(JobPosting posting);

    boolean existsByPostingAndEmailIgnoreCase(JobPosting posting, String email);

    long countByPosting(JobPosting posting);
}
