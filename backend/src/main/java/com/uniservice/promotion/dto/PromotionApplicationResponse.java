package com.uniservice.promotion.dto;

import com.uniservice.promotion.entity.*;
import java.time.*;

public record PromotionApplicationResponse(Long id, Long staffProfileId, String staffFullName, String staffNumber,
        Integer currentGradeLevel, Integer requestedGradeLevel,
        LocalDate eligibilityDate, PromotionApplicationStatus status, String staffStatement,
        String reviewerComment, String reviewedByUsername, Instant reviewedAt,
        LocalDate examScheduledDate, LocalDate interviewScheduledDate, Instant createdAt) {
    public static PromotionApplicationResponse from(PromotionApplication app) {
        var profile = app.getStaffProfile();
        return new PromotionApplicationResponse(
                app.getId(),
                profile.getId(),
                profile.getUser().getFirstName() + " " + profile.getUser().getLastName(),
                profile.getStaffNumber(),
                app.getCurrentGradeLevel(), app.getRequestedGradeLevel(),
                app.getEligibilityDate(), app.getStatus(), app.getStaffStatement(), app.getReviewerComment(),
                app.getReviewedBy() != null ? app.getReviewedBy().getUsername() : null,
                app.getReviewedAt(),
                app.getExamScheduledDate(), app.getInterviewScheduledDate(),
                app.getCreatedAt());
    }
}
