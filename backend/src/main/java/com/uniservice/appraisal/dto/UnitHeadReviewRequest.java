package com.uniservice.appraisal.dto;

import com.uniservice.appraisal.entity.OverallGrading;
import com.uniservice.appraisal.entity.Promotability;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class UnitHeadReviewRequest {

    @NotNull @Min(1) @Max(5) private Integer ratingQualityOfWork;
    @NotNull @Min(1) @Max(5) private Integer ratingKnowledgeOfWork;
    @NotNull @Min(1) @Max(5) private Integer ratingPerformanceUnderStress;
    @NotNull @Min(1) @Max(5) private Integer ratingInitiative;
    @NotNull @Min(1) @Max(5) private Integer ratingAdaptability;
    @NotNull @Min(1) @Max(5) private Integer ratingResourcefulness;
    @NotNull @Min(1) @Max(5) private Integer ratingTeamSpirit;
    @NotNull @Min(1) @Max(5) private Integer ratingJobPresence;
    @NotNull @Min(1) @Max(5) private Integer ratingAdministrativeAbility;
    @NotNull @Min(1) @Max(5) private Integer ratingAttitudeToWork;
    @NotNull @Min(1) @Max(5) private Integer ratingKnowledgeOfIct;
    @NotNull @Min(1) @Max(5) private Integer ratingPunctuality;
    @NotNull @Min(1) @Max(5) private Integer ratingAppearance;

    private String loyaltyToInstitution;

    @NotNull
    private OverallGrading overallGrading;

    private String coursesAttended;
    private String trainingNeeds;

    @NotNull
    private Promotability promotability;

    private String promotabilityComments;
    private String longTermPotentials;
    private String generalRemarks;
    private Integer servedUnderReportingOfficerYears;
    private Integer numberOfQueries;
    private String pendingDisciplinaryAction;
    private String concludedDisciplinaryAction;
    private String unitHeadPost;

    private List<SickLeaveEntryRequest> sickLeaves = new ArrayList<>();
}
