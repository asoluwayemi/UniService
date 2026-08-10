package com.uniservice.leave.dto;

import com.uniservice.leave.entity.*;
import java.math.BigDecimal;
import java.time.*;

public record LeaveRequestResponse(
        Long id,
        Long staffProfileId,
        String staffName,
        LeaveType leaveType,
        LocalDate startDate,
        LocalDate endDate,
        int numberOfDays,
        String reason,
        LeaveStatus status,
        String reviewerName,
        String reviewerComment,
        Instant reviewedAt,
        Long handoverOfficerId,
        String handoverOfficerName,
        String handoverNotes,
        String handoverStatus,
        LocalDate resumptionDate,
        String resumptionNotes,
        String resumptionStatus,
        Instant resumptionConfirmedAt,
        Boolean allowanceEligible,
        String allowanceHandoffStatus,
        BigDecimal allowanceAmount,
        Instant createdAt) {

    public static LeaveRequestResponse from(LeaveRequest request) {
        var user = request.getStaffProfile().getUser();
        var reviewer = request.getReviewer();
        var handover = request.getHandoverOfficer();
        return new LeaveRequestResponse(
                request.getId(),
                request.getStaffProfile().getId(),
                user.getFirstName() + " " + user.getLastName(),
                request.getLeaveType(),
                request.getStartDate(),
                request.getEndDate(),
                request.getNumberOfDays(),
                request.getReason(),
                request.getStatus(),
                reviewer == null ? null : reviewer.getFirstName() + " " + reviewer.getLastName(),
                request.getReviewerComment(),
                request.getReviewedAt(),
                handover == null ? null : handover.getId(),
                handover == null ? null : handover.getFirstName() + " " + handover.getLastName(),
                request.getHandoverNotes(),
                request.getHandoverStatus(),
                request.getResumptionDate(),
                request.getResumptionNotes(),
                request.getResumptionStatus(),
                request.getResumptionConfirmedAt(),
                request.getAllowanceEligible(),
                request.getAllowanceHandoffStatus(),
                request.getAllowanceAmount(),
                request.getCreatedAt());
    }
}
