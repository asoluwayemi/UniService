package com.uniservice.staff.dto;

import com.uniservice.staff.entity.EmploymentStatus;
import com.uniservice.staff.entity.EmploymentType;
import com.uniservice.staff.entity.StaffCategory;
import com.uniservice.staff.entity.StaffProfile;

public record StaffProfileSummaryResponse(
        Long id,
        String staffNumber,
        String firstName,
        String lastName,
        String email,
        StaffCategory category,
        String designation,
        Long orgUnitId,
        String orgUnitName,
        EmploymentType employmentType,
        EmploymentStatus employmentStatus
) {
    public static StaffProfileSummaryResponse from(StaffProfile p) {
        return new StaffProfileSummaryResponse(
                p.getId(),
                p.getStaffNumber(),
                p.getUser().getFirstName(),
                p.getUser().getLastName(),
                p.getUser().getEmail(),
                p.getCategory(),
                p.getDesignation(),
                p.getOrgUnit() != null ? p.getOrgUnit().getId() : null,
                p.getOrgUnit() != null ? p.getOrgUnit().getName() : null,
                p.getEmploymentType(),
                p.getEmploymentStatus()
        );
    }
}
