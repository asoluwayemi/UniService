package com.uniservice.promotion.dto;

import java.time.LocalDate;
import java.util.List;

public record PromotionEligibilityResponse(boolean eligible, LocalDate dueDate, Integer gradeLevel,
        int requiredYearsInPost, int completedAppraisals, int requiredAppraisals, List<String> outstandingCriteria) {}
