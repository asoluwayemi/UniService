package com.uniservice.org.entity;

import com.uniservice.auth.entity.User;
import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "org_unit_change_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgUnitChangeRequest extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChangeRequestAction action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_org_unit_id")
    private OrgUnit targetOrgUnit;

    @Column(name = "proposed_name", length = 150)
    private String proposedName;

    @Column(name = "proposed_code", length = 30)
    private String proposedCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "proposed_type", length = 20)
    private OrgUnitType proposedType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_parent_id")
    private OrgUnit proposedParent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_head_id")
    private User proposedHead;

    @Column(name = "proposed_is_hr_unit")
    private Boolean proposedIsHrUnit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ChangeRequestStatus status = ChangeRequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    private Instant reviewedAt;

    @Version
    @Builder.Default
    private Integer version = 0;
}
