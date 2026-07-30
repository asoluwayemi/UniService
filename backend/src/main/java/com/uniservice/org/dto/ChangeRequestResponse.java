package com.uniservice.org.dto;

import com.uniservice.org.entity.ChangeRequestAction;
import com.uniservice.org.entity.ChangeRequestStatus;
import com.uniservice.org.entity.OrgUnitChangeRequest;
import com.uniservice.org.entity.OrgUnitType;

import java.time.Instant;

public record ChangeRequestResponse(
        Long id,
        ChangeRequestAction action,
        Long targetOrgUnitId,
        String targetOrgUnitName,
        String proposedName,
        String proposedCode,
        OrgUnitType proposedType,
        Long proposedParentId,
        String proposedParentName,
        Long proposedHeadId,
        String proposedHeadName,
        ChangeRequestStatus status,
        String requestedByUsername,
        String reviewedByUsername,
        String reviewNotes,
        Instant createdAt,
        Instant reviewedAt
) {
    public static ChangeRequestResponse from(OrgUnitChangeRequest r) {
        return new ChangeRequestResponse(
                r.getId(),
                r.getAction(),
                r.getTargetOrgUnit() != null ? r.getTargetOrgUnit().getId() : null,
                r.getTargetOrgUnit() != null ? r.getTargetOrgUnit().getName() : null,
                r.getProposedName(),
                r.getProposedCode(),
                r.getProposedType(),
                r.getProposedParent() != null ? r.getProposedParent().getId() : null,
                r.getProposedParent() != null ? r.getProposedParent().getName() : null,
                r.getProposedHead() != null ? r.getProposedHead().getId() : null,
                r.getProposedHead() != null ? r.getProposedHead().getFirstName() + " " + r.getProposedHead().getLastName() : null,
                r.getStatus(),
                r.getRequestedBy().getUsername(),
                r.getReviewedBy() != null ? r.getReviewedBy().getUsername() : null,
                r.getReviewNotes(),
                r.getCreatedAt(),
                r.getReviewedAt()
        );
    }
}
