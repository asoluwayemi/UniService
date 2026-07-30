package com.uniservice.appraisal.dto;

import com.uniservice.appraisal.entity.AppraisalForm;
import com.uniservice.appraisal.entity.AppraisalStatus;

public record AppraisalSummaryResponse(
        Long id,
        Integer cycleYear,
        Long staffProfileId,
        String staffFullName,
        AppraisalStatus status
) {
    public static AppraisalSummaryResponse from(AppraisalForm f) {
        return new AppraisalSummaryResponse(
                f.getId(),
                f.getCycle().getYear(),
                f.getStaffProfile().getId(),
                f.getStaffProfile().getUser().getFirstName() + " " + f.getStaffProfile().getUser().getLastName(),
                f.getStatus()
        );
    }
}
