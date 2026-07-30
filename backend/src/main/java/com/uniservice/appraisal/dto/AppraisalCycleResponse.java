package com.uniservice.appraisal.dto;

import com.uniservice.appraisal.entity.AppraisalCycle;
import com.uniservice.appraisal.entity.AppraisalCycleStatus;

public record AppraisalCycleResponse(Long id, Integer year, AppraisalCycleStatus status) {
    public static AppraisalCycleResponse from(AppraisalCycle cycle) {
        return new AppraisalCycleResponse(cycle.getId(), cycle.getYear(), cycle.getStatus());
    }
}
