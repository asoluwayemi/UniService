package com.uniservice.staff.dto;

import com.uniservice.staff.entity.AcademicQualification;

public record AcademicQualificationResponse(
        Long id,
        String degree,
        String fieldOfStudy,
        String institution,
        Integer yearObtained,
        String documentUrl
) {
    public static AcademicQualificationResponse from(AcademicQualification q) {
        return new AcademicQualificationResponse(
                q.getId(), q.getDegree(), q.getFieldOfStudy(), q.getInstitution(), q.getYearObtained(), q.getDocumentUrl());
    }
}
