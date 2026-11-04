package com.uniservice.recruitment.dto;

import com.uniservice.recruitment.entity.ApplicationStage;
import com.uniservice.recruitment.entity.JobApplication;

import java.time.Instant;
import java.util.Set;

public record ApplicationResponse(Long id, Long postingId, String applicantName, String email, String phone,
                                  String coverNote, ApplicationStage stage, String stageNote, Instant appliedAt,
                                  Set<ApplicationStage> allowedNext) {
    public static ApplicationResponse from(JobApplication a) {
        return new ApplicationResponse(a.getId(), a.getPosting().getId(), a.getApplicantName(), a.getEmail(),
                a.getPhone(), a.getCoverNote(), a.getStage(), a.getStageNote(), a.getAppliedAt(), a.getStage().next());
    }
}
