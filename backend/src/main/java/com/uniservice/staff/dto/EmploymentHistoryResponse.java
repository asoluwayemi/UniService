package com.uniservice.staff.dto;

import com.uniservice.staff.entity.EmploymentHistory;

import java.time.LocalDate;

public record EmploymentHistoryResponse(
        Long id,
        String organization,
        String positionTitle,
        LocalDate startDate,
        LocalDate endDate,
        String description
) {
    public static EmploymentHistoryResponse from(EmploymentHistory h) {
        return new EmploymentHistoryResponse(
                h.getId(), h.getOrganization(), h.getPositionTitle(), h.getStartDate(), h.getEndDate(), h.getDescription());
    }
}
