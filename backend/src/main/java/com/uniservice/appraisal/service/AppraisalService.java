package com.uniservice.appraisal.service;

import com.uniservice.appraisal.dto.*;
import com.uniservice.appraisal.entity.*;
import com.uniservice.appraisal.repository.AppraisalCycleRepository;
import com.uniservice.appraisal.repository.AppraisalFormRepository;
import com.uniservice.appraisal.repository.AppraisalSickLeaveRepository;
import com.uniservice.auth.entity.User;
import com.uniservice.notification.service.NotificationService;
import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitType;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.StaffProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AppraisalService {

    private static final String MY_APPRAISAL_LINK = "/my-appraisal";
    private static final String PENDING_ACTIONS_LINK = "/appraisals/pending";

    private final AppraisalCycleRepository cycleRepository;
    private final AppraisalFormRepository formRepository;
    private final AppraisalSickLeaveRepository sickLeaveRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final NotificationService notificationService;

    // --- Cycles ---

    @Transactional
    public AppraisalCycleResponse createCycle(CreateAppraisalCycleRequest request) {
        if (cycleRepository.findByYear(request.getYear()).isPresent()) {
            throw new IllegalArgumentException("An appraisal cycle for " + request.getYear() + " already exists");
        }
        AppraisalCycle cycle = AppraisalCycle.builder().year(request.getYear()).build();
        return AppraisalCycleResponse.from(cycleRepository.save(cycle));
    }

    @Transactional
    public AppraisalCycleResponse closeCycle(Long cycleId) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NoSuchElementException("Appraisal cycle not found"));
        cycle.setStatus(AppraisalCycleStatus.CLOSED);
        return AppraisalCycleResponse.from(cycleRepository.save(cycle));
    }

    public List<AppraisalCycleResponse> listCycles() {
        return cycleRepository.findAllByOrderByYearDesc().stream().map(AppraisalCycleResponse::from).toList();
    }

    // --- Forms ---

    @Transactional
    public AppraisalFormResponse getOrCreateMine(Long cycleId, User user) {
        AppraisalCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new NoSuchElementException("Appraisal cycle not found"));
        StaffProfile staffProfile = staffProfileRepository.findByUser(user)
                .orElseThrow(() -> new NoSuchElementException("No staff profile exists for this account yet"));

        AppraisalForm form = formRepository.findByCycleAndStaffProfile(cycle, staffProfile)
                .orElseGet(() -> {
                    if (cycle.getStatus() != AppraisalCycleStatus.OPEN) {
                        throw new IllegalArgumentException("This appraisal cycle is closed");
                    }
                    AppraisalForm created = AppraisalForm.builder()
                            .cycle(cycle)
                            .staffProfile(staffProfile)
                            .scheduleOfDuties(staffProfile.getScheduleOfDuties())
                            .build();
                    return formRepository.save(created);
                });
        return toResponse(form, user);
    }

    public AppraisalFormResponse getById(Long formId, User user) {
        AppraisalForm form = findForm(formId);
        assertCanView(form, user);
        return toResponse(form, user);
    }

    public List<AppraisalSummaryResponse> listForStaff(Long staffProfileId) {
        StaffProfile staffProfile = staffProfileRepository.findById(staffProfileId)
                .orElseThrow(() -> new NoSuchElementException("Staff profile not found"));
        return formRepository.findByStaffProfileOrderByCreatedAtDesc(staffProfile).stream()
                .map(AppraisalSummaryResponse::from).toList();
    }

    public List<AppraisalSummaryResponse> listPendingMyAction(User user) {
        Stream<AppraisalForm> awaitingMeAsUnitHead = formRepository.findByStatus(AppraisalStatus.AWAITING_UNIT_HEAD)
                .stream().filter(f -> sameUser(resolveUnitHead(f), user));
        Stream<AppraisalForm> awaitingMeAsDeptHead = formRepository.findByStatus(AppraisalStatus.AWAITING_DEPARTMENT_HEAD)
                .stream().filter(f -> sameUser(resolveDepartmentHead(f), user));
        return Stream.concat(awaitingMeAsUnitHead, awaitingMeAsDeptHead)
                .map(AppraisalSummaryResponse::from)
                .toList();
    }

    @Transactional
    public AppraisalFormResponse submitStaffBiodata(Long formId, StaffSubmitBiodataRequest request, User user) {
        AppraisalForm form = findForm(formId);
        assertOwner(form, user);
        assertStatus(form, AppraisalStatus.STAFF_DRAFT);

        form.setScheduleOfDuties(request.getScheduleOfDuties());
        form.setStatus(AppraisalStatus.AWAITING_UNIT_HEAD);
        formRepository.save(form);

        User unitHead = resolveUnitHead(form);
        if (unitHead != null) {
            notificationService.notify(unitHead,
                    "A new appraisal is awaiting your review for " + staffDisplayName(form), PENDING_ACTIONS_LINK);
        }
        return toResponse(form, user);
    }

    @Transactional
    public AppraisalFormResponse submitUnitHeadReview(Long formId, UnitHeadReviewRequest request, User user) {
        AppraisalForm form = findForm(formId);
        assertStatus(form, AppraisalStatus.AWAITING_UNIT_HEAD);
        User unitHead = resolveUnitHead(form);
        if (unitHead == null || !unitHead.getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not the head of this staff member's unit");
        }

        form.setRatingQualityOfWork(request.getRatingQualityOfWork());
        form.setRatingKnowledgeOfWork(request.getRatingKnowledgeOfWork());
        form.setRatingPerformanceUnderStress(request.getRatingPerformanceUnderStress());
        form.setRatingInitiative(request.getRatingInitiative());
        form.setRatingAdaptability(request.getRatingAdaptability());
        form.setRatingResourcefulness(request.getRatingResourcefulness());
        form.setRatingTeamSpirit(request.getRatingTeamSpirit());
        form.setRatingJobPresence(request.getRatingJobPresence());
        form.setRatingAdministrativeAbility(request.getRatingAdministrativeAbility());
        form.setRatingAttitudeToWork(request.getRatingAttitudeToWork());
        form.setRatingKnowledgeOfIct(request.getRatingKnowledgeOfIct());
        form.setRatingPunctuality(request.getRatingPunctuality());
        form.setRatingAppearance(request.getRatingAppearance());
        form.setLoyaltyToInstitution(request.getLoyaltyToInstitution());
        form.setOverallGrading(request.getOverallGrading());
        form.setCoursesAttended(request.getCoursesAttended());
        form.setTrainingNeeds(request.getTrainingNeeds());
        form.setPromotability(request.getPromotability());
        form.setPromotabilityComments(request.getPromotabilityComments());
        form.setLongTermPotentials(request.getLongTermPotentials());
        form.setGeneralRemarks(request.getGeneralRemarks());
        form.setServedUnderReportingOfficerYears(request.getServedUnderReportingOfficerYears());
        form.setNumberOfQueries(request.getNumberOfQueries());
        form.setPendingDisciplinaryAction(request.getPendingDisciplinaryAction());
        form.setConcludedDisciplinaryAction(request.getConcludedDisciplinaryAction());
        form.setUnitHead(user);
        form.setUnitHeadPost(request.getUnitHeadPost());
        form.setUnitHeadSignedAt(Instant.now());
        form.setStatus(AppraisalStatus.AWAITING_STAFF_COUNTER_COMMENT);
        formRepository.save(form);

        for (SickLeaveEntryRequest entry : request.getSickLeaves()) {
            sickLeaveRepository.save(AppraisalSickLeave.builder()
                    .appraisalForm(form)
                    .fromDate(entry.getFromDate())
                    .toDate(entry.getToDate())
                    .numberOfDays(entry.getNumberOfDays())
                    .build());
        }

        notificationService.notify(form.getStaffProfile().getUser(),
                "Your appraisal has been reviewed and is ready for your comments", MY_APPRAISAL_LINK);
        return toResponse(form, user);
    }

    @Transactional
    public AppraisalFormResponse submitStaffCounterComment(Long formId, StaffCounterCommentRequest request, User user) {
        AppraisalForm form = findForm(formId);
        assertOwner(form, user);
        assertStatus(form, AppraisalStatus.AWAITING_STAFF_COUNTER_COMMENT);

        form.setStaffComments(request.getStaffComments());
        form.setStaffCommentedAt(Instant.now());
        form.setStatus(AppraisalStatus.AWAITING_DEPARTMENT_HEAD);
        formRepository.save(form);

        User departmentHead = resolveDepartmentHead(form);
        if (departmentHead != null) {
            notificationService.notify(departmentHead,
                    "An appraisal is awaiting your sign-off for " + staffDisplayName(form), PENDING_ACTIONS_LINK);
        }
        return toResponse(form, user);
    }

    @Transactional
    public AppraisalFormResponse submitDepartmentHeadSignOff(Long formId, DepartmentHeadSignRequest request, User user) {
        AppraisalForm form = findForm(formId);
        assertStatus(form, AppraisalStatus.AWAITING_DEPARTMENT_HEAD);
        User departmentHead = resolveDepartmentHead(form);
        if (departmentHead == null || !departmentHead.getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not the head of this staff member's department");
        }

        form.setDepartmentHeadComments(request.getDepartmentHeadComments());
        form.setDepartmentHead(user);
        form.setDepartmentHeadSignedAt(Instant.now());
        form.setStatus(AppraisalStatus.COMPLETED);
        formRepository.save(form);

        notificationService.notify(form.getStaffProfile().getUser(),
                "Your appraisal for " + form.getCycle().getYear() + " is complete", MY_APPRAISAL_LINK);
        return toResponse(form, user);
    }

    // --- Promotion eligibility (used by StaffProfileService) ---

    public int countCompletedAppraisalsSincePromotion(StaffProfile staffProfile) {
        var baseline = staffProfile.getLastPromotionDate() != null
                ? staffProfile.getLastPromotionDate()
                : staffProfile.getDateOfHire();
        if (baseline == null) {
            return 0;
        }
        return (int) formRepository.findByStaffProfileAndStatus(staffProfile, AppraisalStatus.COMPLETED).stream()
                .filter(f -> f.getCycle().getYear() > baseline.getYear())
                .count();
    }

    // --- Org hierarchy resolution ---

    private User resolveUnitHead(AppraisalForm form) {
        OrgUnit unit = form.getStaffProfile().getOrgUnit();
        return unit != null ? unit.getHead() : null;
    }

    private User resolveDepartmentHead(AppraisalForm form) {
        OrgUnit department = resolveDepartmentUnit(form.getStaffProfile().getOrgUnit());
        return department != null ? department.getHead() : null;
    }

    private OrgUnit resolveDepartmentUnit(OrgUnit unit) {
        OrgUnit current = unit;
        while (current != null) {
            if (current.getType() == OrgUnitType.DEPARTMENT) {
                return current;
            }
            current = current.getParent();
        }
        return null;
    }

    private boolean sameUser(User candidate, User user) {
        return candidate != null && candidate.getId().equals(user.getId());
    }

    // --- Shared helpers ---

    private AppraisalForm findForm(Long id) {
        return formRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Appraisal form not found"));
    }

    private void assertOwner(AppraisalForm form, User user) {
        if (!form.getStaffProfile().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("This appraisal does not belong to you");
        }
    }

    private void assertStatus(AppraisalForm form, AppraisalStatus expected) {
        if (form.getStatus() != expected) {
            throw new IllegalArgumentException("This appraisal is not awaiting that action");
        }
    }

    private void assertCanView(AppraisalForm form, User user) {
        boolean isOwner = form.getStaffProfile().getUser().getId().equals(user.getId());
        boolean isUnitHead = sameUser(resolveUnitHead(form), user);
        boolean isDepartmentHead = sameUser(resolveDepartmentHead(form), user);
        boolean hasBlanketAccess = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .anyMatch(p -> p.getName().equals("APPRAISAL_READ"));
        if (!isOwner && !isUnitHead && !isDepartmentHead && !hasBlanketAccess) {
            throw new AccessDeniedException("You do not have access to this appraisal");
        }
    }

    private String staffDisplayName(AppraisalForm form) {
        User staffUser = form.getStaffProfile().getUser();
        return staffUser.getFirstName() + " " + staffUser.getLastName();
    }

    private AppraisalFormResponse toResponse(AppraisalForm form, User viewer) {
        List<AppraisalSickLeave> sickLeaves = sickLeaveRepository.findByAppraisalForm(form);
        boolean viewerIsOwner = sameUser(form.getStaffProfile().getUser(), viewer);
        boolean viewerIsUnitHead = sameUser(resolveUnitHead(form), viewer);
        boolean viewerIsDepartmentHead = sameUser(resolveDepartmentHead(form), viewer);
        return AppraisalFormResponse.from(form, sickLeaves, viewerIsOwner, viewerIsUnitHead, viewerIsDepartmentHead);
    }
}
