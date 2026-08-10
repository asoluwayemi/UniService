package com.uniservice.leave.entity;

import com.uniservice.auth.entity.User;
import com.uniservice.core.common.BaseEntity;
import com.uniservice.staff.entity.StaffProfile;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity
@Table(name = "leave_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaveRequest extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "staff_profile_id", nullable = false)
    private StaffProfile staffProfile;
    @Enumerated(EnumType.STRING) @Column(name = "leave_type", nullable = false, length = 30)
    private LeaveType leaveType;
    @Column(name = "start_date", nullable = false) private LocalDate startDate;
    @Column(name = "end_date", nullable = false) private LocalDate endDate;
    @Column(name = "number_of_days", nullable = false) private int numberOfDays;
    @Column(nullable = false, length = 1000) private String reason;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewer_id") private User reviewer;
    @Column(name = "reviewer_comment", length = 1000) private String reviewerComment;
    @Column(name = "reviewed_at") private Instant reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "handover_officer_id") private User handoverOfficer;
    @Column(name = "handover_notes", length = 1000) private String handoverNotes;
    @Builder.Default @Column(name = "handover_status", length = 30) private String handoverStatus = "NOT_REQUIRED";

    @Column(name = "resumption_date") private LocalDate resumptionDate;
    @Column(name = "resumption_notes", length = 1000) private String resumptionNotes;
    @Builder.Default @Column(name = "resumption_status", length = 30) private String resumptionStatus = "NOT_RESUMED";
    @Column(name = "resumption_confirmed_at") private Instant resumptionConfirmedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "resumption_confirmed_by") private User resumptionConfirmedBy;

    @Builder.Default @Column(name = "allowance_eligible") private Boolean allowanceEligible = false;
    @Builder.Default @Column(name = "allowance_handoff_status", length = 30) private String allowanceHandoffStatus = "NOT_ELIGIBLE";
    @Column(name = "allowance_amount") private java.math.BigDecimal allowanceAmount;
}
