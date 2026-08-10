package com.uniservice.promotion.entity;

import com.uniservice.auth.entity.User;
import com.uniservice.core.common.BaseEntity;
import com.uniservice.staff.entity.StaffProfile;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity
@Table(name = "promotion_applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PromotionApplication extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "staff_profile_id", nullable = false)
    private StaffProfile staffProfile;
    @Column(name = "current_grade_level", nullable = false) private int currentGradeLevel;
    @Column(name = "requested_grade_level", nullable = false) private int requestedGradeLevel;
    @Column(name = "eligibility_date", nullable = false) private LocalDate eligibilityDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) @Builder.Default
    private PromotionApplicationStatus status = PromotionApplicationStatus.SUBMITTED;
    @Column(name = "staff_statement", length = 2000) private String staffStatement;
    @Column(name = "reviewer_comment", length = 2000) private String reviewerComment;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by") private User reviewedBy;
    @Column(name = "reviewed_at") private Instant reviewedAt;
}
