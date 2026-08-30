package com.uniservice.promotion.dto;

import com.uniservice.promotion.entity.PromotionApplication;
import com.uniservice.promotion.entity.PromotionApplicationStatus;

public record PromotionSummaryResponse(
        Long id,
        Long staffProfileId,
        String staffFullName,
        String staffNumber,
        Integer currentGradeLevel,
        Integer requestedGradeLevel,
        PromotionApplicationStatus status
) {
    public static PromotionSummaryResponse from(PromotionApplication app) {
        var profile = app.getStaffProfile();
        return new PromotionSummaryResponse(
                app.getId(),
                profile.getId(),
                profile.getUser().getFirstName() + " " + profile.getUser().getLastName(),
                profile.getStaffNumber(),
                app.getCurrentGradeLevel(),
                app.getRequestedGradeLevel(),
                app.getStatus());
    }
}
