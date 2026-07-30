package com.uniservice.appraisal.dto;

import com.uniservice.appraisal.entity.AppraisalSickLeave;

import java.time.LocalDate;

public record AppraisalSickLeaveResponse(Long id, LocalDate fromDate, LocalDate toDate, Integer numberOfDays) {
    public static AppraisalSickLeaveResponse from(AppraisalSickLeave s) {
        return new AppraisalSickLeaveResponse(s.getId(), s.getFromDate(), s.getToDate(), s.getNumberOfDays());
    }
}
