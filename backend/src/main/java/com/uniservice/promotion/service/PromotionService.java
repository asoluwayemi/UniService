package com.uniservice.promotion.service;

import com.uniservice.appraisal.service.AppraisalService;
import com.uniservice.auth.entity.User;
import com.uniservice.promotion.dto.*;
import com.uniservice.promotion.entity.*;
import com.uniservice.promotion.repository.PromotionApplicationRepository;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.StaffProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private static final int REQUIRED_APPRAISALS = 3;
    private static final int REQUIRED_TENURE_YEARS = 3;

    private final StaffProfileRepository staffProfiles;
    private final PromotionApplicationRepository applications;
    private final AppraisalService appraisals;

    @Transactional(readOnly = true)
    public PromotionEligibilityResponse eligibility(User user) {
        return eligibility(profileFor(user));
    }

    @Transactional(readOnly = true)
    public List<PromotionApplicationResponse> mine(User user) {
        return applications.findByStaffProfileOrderByCreatedAtDesc(profileFor(user))
                .stream()
                .map(PromotionApplicationResponse::from)
                .toList();
    }

    @Transactional
    public PromotionApplicationResponse apply(CreatePromotionApplicationRequest request, User user) {
        StaffProfile profile = profileFor(user);
        PromotionEligibilityResponse eligibility = eligibility(profile);
        if (!eligibility.eligible()) {
            throw new IllegalArgumentException("You are not currently eligible for promotion: " + String.join("; ", eligibility.outstandingCriteria()));
        }
        if (applications.existsByStaffProfileAndStatusIn(profile, List.of(
                PromotionApplicationStatus.SUBMITTED,
                PromotionApplicationStatus.DOCUMENTS_PENDING,
                PromotionApplicationStatus.DOCUMENTS_VERIFIED,
                PromotionApplicationStatus.EXAM_SCHEDULED,
                PromotionApplicationStatus.ORAL_INTERVIEW_SCHEDULED,
                PromotionApplicationStatus.RECOMMENDED))) {
            throw new IllegalArgumentException("You already have an active promotion application");
        }
        PromotionApplication application = PromotionApplication.builder()
                .staffProfile(profile)
                .currentGradeLevel(profile.getGradeLevel())
                .requestedGradeLevel(profile.getGradeLevel() + 1)
                .eligibilityDate(eligibility.dueDate())
                .staffStatement(request.staffStatement())
                .build();
        return PromotionApplicationResponse.from(applications.save(application));
    }

    private PromotionEligibilityResponse eligibility(StaffProfile profile) {
        List<String> outstanding = new ArrayList<>();
        Integer grade = profile.getGradeLevel();
        if (grade == null) {
            outstanding.add("Your grade level has not been recorded by HR");
            return new PromotionEligibilityResponse(false, null, null, REQUIRED_TENURE_YEARS, 0, REQUIRED_APPRAISALS, outstanding);
        }

        LocalDate baseline = profile.getLastPromotionDate() != null ? profile.getLastPromotionDate()
                : profile.getDateAppointedToPresentPost() != null ? profile.getDateAppointedToPresentPost()
                : profile.getDateOfHire();
        
        LocalDate dueDate = baseline != null ? baseline.plusYears(REQUIRED_TENURE_YEARS) : LocalDate.now();

        if (LocalDate.now().isBefore(dueDate)) {
            outstanding.add("Promotions require 3 years continuous service in current post (eligible on " + dueDate + ")");
        }

        int completed = appraisals.countCompletedAppraisalsSincePromotion(profile);
        if (completed < REQUIRED_APPRAISALS) {
            outstanding.add("Requires at least " + REQUIRED_APPRAISALS + " completed annual appraisals since last promotion (currently " + completed + " completed)");
        }

        return new PromotionEligibilityResponse(outstanding.isEmpty(), dueDate, grade, REQUIRED_TENURE_YEARS, completed, REQUIRED_APPRAISALS, outstanding);
    }

    private StaffProfile profileFor(User user) {
        return staffProfiles.findByUser(user)
                .orElseThrow(() -> new NoSuchElementException("No staff profile exists for this account yet"));
    }
}
