package com.uniservice.promotion.service;

import com.uniservice.appraisal.service.AppraisalService;
import com.uniservice.auth.entity.User;
import com.uniservice.notification.service.NotificationService;
import com.uniservice.promotion.dto.*;
import com.uniservice.promotion.entity.*;
import com.uniservice.promotion.repository.PromotionApplicationRepository;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.StaffProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private static final int REQUIRED_APPRAISALS = 3;
    private static final int REQUIRED_TENURE_YEARS = 3;
    private static final String CAREER_LINK = "/career";

    private final StaffProfileRepository staffProfiles;
    private final PromotionApplicationRepository applications;
    private final AppraisalService appraisals;
    private final NotificationService notificationService;

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

    @Transactional(readOnly = true)
    public List<PromotionSummaryResponse> listAll() {
        return applications.findAll().stream()
                .sorted(Comparator.comparing(PromotionApplication::getCreatedAt).reversed())
                .map(PromotionSummaryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PromotionApplicationResponse getById(Long id, User caller, boolean canManage) {
        PromotionApplication app = findApplication(id);
        if (!canManage && !app.getStaffProfile().getUser().getId().equals(caller.getId())) {
            throw new AccessDeniedException("You do not have access to this promotion application");
        }
        return PromotionApplicationResponse.from(app);
    }

    @Transactional
    public PromotionApplicationResponse requestMoreDocuments(Long id, PromotionCommentRequest request, User reviewer) {
        PromotionApplication app = findApplication(id);
        assertStatusIn(app, PromotionApplicationStatus.SUBMITTED, PromotionApplicationStatus.DOCUMENTS_PENDING);
        requireComment(request.getComment(), "Please explain what documents are missing");

        app.setStatus(PromotionApplicationStatus.DOCUMENTS_PENDING);
        app.setReviewerComment(request.getComment());
        markReviewed(app, reviewer);
        applications.save(app);

        notify(app, "More documents are needed for your promotion application: " + request.getComment());
        return PromotionApplicationResponse.from(app);
    }

    @Transactional
    public PromotionApplicationResponse verifyDocuments(Long id, PromotionCommentRequest request, User reviewer) {
        PromotionApplication app = findApplication(id);
        assertStatusIn(app, PromotionApplicationStatus.SUBMITTED, PromotionApplicationStatus.DOCUMENTS_PENDING);

        app.setStatus(PromotionApplicationStatus.DOCUMENTS_VERIFIED);
        app.setReviewerComment(request.getComment());
        markReviewed(app, reviewer);
        applications.save(app);

        notify(app, "Your promotion application documents have been verified");
        return PromotionApplicationResponse.from(app);
    }

    @Transactional
    public PromotionApplicationResponse scheduleExam(Long id, SchedulePromotionExamRequest request, User reviewer) {
        PromotionApplication app = findApplication(id);
        assertStatusIn(app, PromotionApplicationStatus.DOCUMENTS_VERIFIED);

        app.setStatus(PromotionApplicationStatus.EXAM_SCHEDULED);
        app.setExamScheduledDate(request.getExamDate());
        app.setReviewerComment(request.getComment());
        markReviewed(app, reviewer);
        applications.save(app);

        notify(app, "Your promotion exam has been scheduled for " + request.getExamDate());
        return PromotionApplicationResponse.from(app);
    }

    @Transactional
    public PromotionApplicationResponse scheduleInterview(Long id, SchedulePromotionInterviewRequest request, User reviewer) {
        PromotionApplication app = findApplication(id);
        assertStatusIn(app, PromotionApplicationStatus.EXAM_SCHEDULED);

        app.setStatus(PromotionApplicationStatus.ORAL_INTERVIEW_SCHEDULED);
        app.setInterviewScheduledDate(request.getInterviewDate());
        app.setReviewerComment(request.getComment());
        markReviewed(app, reviewer);
        applications.save(app);

        notify(app, "Your promotion oral interview has been scheduled for " + request.getInterviewDate());
        return PromotionApplicationResponse.from(app);
    }

    @Transactional
    public PromotionApplicationResponse recommend(Long id, PromotionCommentRequest request, User reviewer) {
        PromotionApplication app = findApplication(id);
        assertStatusIn(app, PromotionApplicationStatus.ORAL_INTERVIEW_SCHEDULED);

        app.setStatus(PromotionApplicationStatus.RECOMMENDED);
        app.setReviewerComment(request.getComment());
        markReviewed(app, reviewer);
        applications.save(app);

        notify(app, "You have been recommended for promotion to Grade Level " + app.getRequestedGradeLevel());
        return PromotionApplicationResponse.from(app);
    }

    @Transactional
    public PromotionApplicationResponse approve(Long id, PromotionCommentRequest request, User reviewer) {
        PromotionApplication app = findApplication(id);
        assertStatusIn(app, PromotionApplicationStatus.RECOMMENDED);

        app.setStatus(PromotionApplicationStatus.APPROVED);
        app.setReviewerComment(request.getComment());
        markReviewed(app, reviewer);
        applications.save(app);

        StaffProfile profile = app.getStaffProfile();
        profile.setGradeLevel(app.getRequestedGradeLevel());
        profile.setGradeStep(1);
        profile.setLastPromotionDate(LocalDate.now());
        staffProfiles.save(profile);

        notify(app, "Congratulations — your promotion to Grade Level " + app.getRequestedGradeLevel() + " has been approved");
        return PromotionApplicationResponse.from(app);
    }

    @Transactional
    public PromotionApplicationResponse gazette(Long id, PromotionCommentRequest request, User reviewer) {
        PromotionApplication app = findApplication(id);
        assertStatusIn(app, PromotionApplicationStatus.APPROVED);

        app.setStatus(PromotionApplicationStatus.GAZETTED);
        app.setReviewerComment(request.getComment());
        markReviewed(app, reviewer);
        applications.save(app);

        notify(app, "Your promotion to Grade Level " + app.getRequestedGradeLevel() + " has been gazetted");
        return PromotionApplicationResponse.from(app);
    }

    @Transactional
    public PromotionApplicationResponse reject(Long id, PromotionCommentRequest request, User reviewer) {
        PromotionApplication app = findApplication(id);
        assertStatusIn(app, PromotionApplicationStatus.SUBMITTED, PromotionApplicationStatus.DOCUMENTS_PENDING,
                PromotionApplicationStatus.DOCUMENTS_VERIFIED, PromotionApplicationStatus.EXAM_SCHEDULED,
                PromotionApplicationStatus.ORAL_INTERVIEW_SCHEDULED, PromotionApplicationStatus.RECOMMENDED);
        requireComment(request.getComment(), "Please explain why this application was rejected");

        app.setStatus(PromotionApplicationStatus.REJECTED);
        app.setReviewerComment(request.getComment());
        markReviewed(app, reviewer);
        applications.save(app);

        notify(app, "Your promotion application was rejected: " + request.getComment());
        return PromotionApplicationResponse.from(app);
    }

    private PromotionApplication findApplication(Long id) {
        return applications.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Promotion application not found"));
    }

    private void assertStatusIn(PromotionApplication app, PromotionApplicationStatus... allowed) {
        if (Arrays.stream(allowed).noneMatch(s -> s == app.getStatus())) {
            throw new IllegalArgumentException(
                    "This application is in status " + app.getStatus() + " and cannot be transitioned from here");
        }
    }

    private void requireComment(String comment, String message) {
        if (comment == null || comment.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    private void markReviewed(PromotionApplication app, User reviewer) {
        app.setReviewedBy(reviewer);
        app.setReviewedAt(Instant.now());
    }

    private void notify(PromotionApplication app, String message) {
        notificationService.notify(app.getStaffProfile().getUser(), message, CAREER_LINK);
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
