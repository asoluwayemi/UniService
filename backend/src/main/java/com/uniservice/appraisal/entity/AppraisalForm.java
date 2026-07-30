package com.uniservice.appraisal.entity;

import com.uniservice.auth.entity.User;
import com.uniservice.core.common.BaseEntity;
import com.uniservice.staff.entity.StaffProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "appraisal_forms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppraisalForm extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    private AppraisalCycle cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_profile_id", nullable = false)
    private StaffProfile staffProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 35)
    @Builder.Default
    private AppraisalStatus status = AppraisalStatus.STAFF_DRAFT;

    // --- Staff stage ---
    @Column(name = "schedule_of_duties", length = 500)
    private String scheduleOfDuties;

    // --- Head of Unit stage: 13 job performance characteristics, rated 1-5 ---
    @Column(name = "rating_quality_of_work")
    private Integer ratingQualityOfWork;
    @Column(name = "rating_knowledge_of_work")
    private Integer ratingKnowledgeOfWork;
    @Column(name = "rating_performance_under_stress")
    private Integer ratingPerformanceUnderStress;
    @Column(name = "rating_initiative")
    private Integer ratingInitiative;
    @Column(name = "rating_adaptability")
    private Integer ratingAdaptability;
    @Column(name = "rating_resourcefulness")
    private Integer ratingResourcefulness;
    @Column(name = "rating_team_spirit")
    private Integer ratingTeamSpirit;
    @Column(name = "rating_job_presence")
    private Integer ratingJobPresence;
    @Column(name = "rating_administrative_ability")
    private Integer ratingAdministrativeAbility;
    @Column(name = "rating_attitude_to_work")
    private Integer ratingAttitudeToWork;
    @Column(name = "rating_knowledge_of_ict")
    private Integer ratingKnowledgeOfIct;
    @Column(name = "rating_punctuality")
    private Integer ratingPunctuality;
    @Column(name = "rating_appearance")
    private Integer ratingAppearance;

    @Column(name = "loyalty_to_institution", length = 1000)
    private String loyaltyToInstitution;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_grading", length = 20)
    private OverallGrading overallGrading;

    @Column(name = "courses_attended", length = 1000)
    private String coursesAttended;

    @Column(name = "training_needs", length = 1000)
    private String trainingNeeds;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Promotability promotability;

    @Column(name = "promotability_comments", length = 1000)
    private String promotabilityComments;

    @Column(name = "long_term_potentials", length = 1000)
    private String longTermPotentials;

    @Column(name = "general_remarks", length = 2000)
    private String generalRemarks;

    @Column(name = "served_under_reporting_officer_years")
    private Integer servedUnderReportingOfficerYears;

    @Column(name = "number_of_queries")
    private Integer numberOfQueries;

    @Column(name = "pending_disciplinary_action", length = 500)
    private String pendingDisciplinaryAction;

    @Column(name = "concluded_disciplinary_action", length = 500)
    private String concludedDisciplinaryAction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_head_id")
    private User unitHead;

    @Column(name = "unit_head_post", length = 150)
    private String unitHeadPost;

    @Column(name = "unit_head_signed_at")
    private Instant unitHeadSignedAt;

    // --- Staff counter-comment stage ---
    @Column(name = "staff_comments", length = 1000)
    private String staffComments;

    @Column(name = "staff_commented_at")
    private Instant staffCommentedAt;

    // --- Head of Department stage ---
    @Column(name = "department_head_comments", length = 1000)
    private String departmentHeadComments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_head_id")
    private User departmentHead;

    @Column(name = "department_head_signed_at")
    private Instant departmentHeadSignedAt;
}
