package com.uniservice.promotion.dto;

import com.uniservice.promotion.entity.*;
import java.time.*;

public record PromotionApplicationResponse(Long id, Integer currentGradeLevel, Integer requestedGradeLevel,
        LocalDate eligibilityDate, PromotionApplicationStatus status, String staffStatement,
        String reviewerComment, Instant createdAt) {
    public static PromotionApplicationResponse from(PromotionApplication app) {
        return new PromotionApplicationResponse(app.getId(), app.getCurrentGradeLevel(), app.getRequestedGradeLevel(),
                app.getEligibilityDate(), app.getStatus(), app.getStaffStatement(), app.getReviewerComment(), app.getCreatedAt());
    }
}
