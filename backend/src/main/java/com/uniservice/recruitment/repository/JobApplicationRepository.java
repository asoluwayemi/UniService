package com.uniservice.recruitment.repository;

import org.springframework.data.jpa.repository.Query;
import com.uniservice.core.common.LabelCount;
import com.uniservice.recruitment.entity.JobApplication;
import com.uniservice.recruitment.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByPostingOrderByAppliedAtDesc(JobPosting posting);

    boolean existsByPostingAndEmailIgnoreCase(JobPosting posting, String email);

    long countByPosting(JobPosting posting);

    @Query("select cast(a.stage as string) as label, count(a) as total from JobApplication a group by a.stage")
    List<LabelCount> countByStage();
}
