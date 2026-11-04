package com.uniservice.recruitment.dto;

import com.uniservice.recruitment.entity.JobPosting;
import com.uniservice.recruitment.entity.PostingCategory;
import com.uniservice.recruitment.entity.PostingStatus;

import java.time.LocalDate;

public record JobPostingResponse(Long id, String title, String department, PostingCategory category,
                                 String description, PostingStatus status, LocalDate closingDate, long applicationCount) {
    public static JobPostingResponse from(JobPosting p, long applicationCount) {
        return new JobPostingResponse(p.getId(), p.getTitle(), p.getDepartment(), p.getCategory(),
                p.getDescription(), p.getStatus(), p.getClosingDate(), applicationCount);
    }
}
