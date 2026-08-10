package com.uniservice.leave.service;

import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.leave.dto.*;
import com.uniservice.leave.entity.*;
import com.uniservice.leave.repository.LeaveRequestRepository;
import com.uniservice.notification.service.NotificationService;
import com.uniservice.org.service.OrgUnitService;
import com.uniservice.staff.entity.*;
import com.uniservice.staff.repository.StaffProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {
    private final LeaveRequestRepository repository;
    private final StaffProfileRepository staffProfiles;
    private final UserRepository userRepository;
    private final OrgUnitService orgUnits;
    private final NotificationService notifications;

    @Transactional(readOnly = true)
    public LeaveBalanceResponse getLeaveBalance(User user) {
        StaffProfile profile = profileFor(user);
        int gradeLevel = profile.getGradeLevel() != null ? profile.getGradeLevel() : 8;
        int entitlement = calculateEntitlement(gradeLevel);

        int currentYear = LocalDate.now().getYear();
        List<LeaveRequest> approvedThisYear = repository.findByStaffProfileOrderByCreatedAtDesc(profile).stream()
                .filter(r -> r.getStatus() == LeaveStatus.APPROVED && r.getStartDate().getYear() == currentYear)
                .toList();

        int usedDays = approvedThisYear.stream().mapToInt(LeaveRequest::getNumberOfDays).sum();
        int remainingDays = Math.max(0, entitlement - usedDays);

        return new LeaveBalanceResponse(gradeLevel, entitlement, usedDays, remainingDays);
    }

    private int calculateEntitlement(int gradeLevel) {
        if (gradeLevel >= 15) return 42;
        if (gradeLevel >= 7) return 30;
        return 21;
    }

    @Transactional
    public LeaveRequestResponse create(CreateLeaveRequest input, User user) {
        if (input.endDate().isBefore(input.startDate())) throw new IllegalArgumentException("End date must not be before start date");
        if (input.startDate().isBefore(LocalDate.now())) throw new IllegalArgumentException("Leave cannot start in the past");

        StaffProfile profile = profileFor(user);
        int days = Math.toIntExact(ChronoUnit.DAYS.between(input.startDate(), input.endDate()) + 1);

        LeaveBalanceResponse balance = getLeaveBalance(user);
        if (days > balance.remainingDaysThisYear()) {
            throw new IllegalArgumentException("Requested " + days + " days exceeds your remaining annual leave balance of " + balance.remainingDaysThisYear() + " days");
        }

        User handoverOfficer = null;
        String handoverStatus = "NOT_REQUIRED";
        if (input.handoverOfficerId() != null) {
            handoverOfficer = userRepository.findById(input.handoverOfficerId())
                    .orElseThrow(() -> new IllegalArgumentException("Handover officer not found"));
            handoverStatus = "PENDING";
        }

        boolean requestAllowance = Boolean.TRUE.equals(input.requestAllowance());
        String allowanceHandoffStatus = requestAllowance ? "PENDING_PAYROLL" : "NOT_ELIGIBLE";
        BigDecimal allowanceAmount = requestAllowance ? BigDecimal.valueOf(50000.00) : BigDecimal.ZERO;

        LeaveRequest request = LeaveRequest.builder()
                .staffProfile(profile)
                .leaveType(input.leaveType())
                .startDate(input.startDate())
                .endDate(input.endDate())
                .numberOfDays(days)
                .reason(input.reason().trim())
                .handoverOfficer(handoverOfficer)
                .handoverNotes(input.handoverNotes())
                .handoverStatus(handoverStatus)
                .allowanceEligible(requestAllowance)
                .allowanceHandoffStatus(allowanceHandoffStatus)
                .allowanceAmount(allowanceAmount)
                .build();

        LeaveRequest saved = repository.save(request);

        if (handoverOfficer != null) {
            notifications.notify(handoverOfficer,
                    user.getFirstName() + " " + user.getLastName() + " selected you as handover officer for their upcoming leave", "/leave");
        }

        approverFor(profile).ifPresent(head -> notifications.notify(head,
                "A leave request from " + user.getFirstName() + " " + user.getLastName() + " awaits your review", "/leave/pending"));

        return LeaveRequestResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> mine(User user) {
        return repository.findByStaffProfileOrderByCreatedAtDesc(profileFor(user)).stream().map(LeaveRequestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> pending(User reviewer) {
        return repository.findByStatusOrderByCreatedAtAsc(LeaveStatus.PENDING).stream()
                .filter(request -> canReview(request, reviewer)).map(LeaveRequestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> handovers(User user) {
        return repository.findByHandoverOfficerIdOrderByCreatedAtDesc(user.getId()).stream().map(LeaveRequestResponse::from).toList();
    }

    @Transactional
    public LeaveRequestResponse acceptHandover(Long id, User user) {
        LeaveRequest request = find(id);
        if (request.getHandoverOfficer() == null || !request.getHandoverOfficer().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not designated as the handover officer for this request");
        }
        request.setHandoverStatus("ACCEPTED");
        LeaveRequest saved = repository.save(request);
        notifications.notify(request.getStaffProfile().getUser(), user.getFirstName() + " " + user.getLastName() + " accepted your leave handover", "/leave");
        return LeaveRequestResponse.from(saved);
    }

    @Transactional
    public LeaveRequestResponse approve(Long id, ReviewLeaveRequest input, User reviewer) {
        return review(id, input, reviewer, LeaveStatus.APPROVED);
    }

    @Transactional
    public LeaveRequestResponse reject(Long id, ReviewLeaveRequest input, User reviewer) {
        return review(id, input, reviewer, LeaveStatus.REJECTED);
    }

    @Transactional
    public LeaveRequestResponse submitResumption(Long id, SubmitResumptionRequest input, User user) {
        LeaveRequest request = find(id);
        if (!request.getStaffProfile().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("This leave request does not belong to you");
        }
        if (request.getStatus() != LeaveStatus.APPROVED) {
            throw new IllegalArgumentException("Resumption certificates can only be submitted for approved leave");
        }
        request.setResumptionDate(input.resumptionDate());
        request.setResumptionNotes(input.resumptionNotes());
        request.setResumptionStatus("PENDING_CONFIRMATION");
        LeaveRequest saved = repository.save(request);

        approverFor(request.getStaffProfile()).ifPresent(head -> notifications.notify(head,
                user.getFirstName() + " " + user.getLastName() + " submitted a leave resumption certificate", "/leave/pending"));

        return LeaveRequestResponse.from(saved);
    }

    @Transactional
    public LeaveRequestResponse confirmResumption(Long id, User reviewer) {
        LeaveRequest request = find(id);
        if (!canReview(request, reviewer)) {
            throw new AccessDeniedException("You are not authorized to confirm resumption for this staff member");
        }
        request.setResumptionStatus("CONFIRMED");
        request.setResumptionConfirmedAt(Instant.now());
        request.setResumptionConfirmedBy(reviewer);
        LeaveRequest saved = repository.save(request);

        notifications.notify(request.getStaffProfile().getUser(), "Your leave resumption has been confirmed", "/leave");
        return LeaveRequestResponse.from(saved);
    }

    @Transactional
    public LeaveRequestResponse cancel(Long id, User user) {
        LeaveRequest request = find(id);
        if (!request.getStaffProfile().getUser().getId().equals(user.getId())) throw new AccessDeniedException("This leave request does not belong to you");
        if (request.getStatus() != LeaveStatus.PENDING) throw new IllegalArgumentException("Only pending leave requests can be cancelled");
        request.setStatus(LeaveStatus.CANCELLED);
        return LeaveRequestResponse.from(repository.save(request));
    }

    private LeaveRequestResponse review(Long id, ReviewLeaveRequest input, User reviewer, LeaveStatus outcome) {
        LeaveRequest request = find(id);
        if (request.getStatus() != LeaveStatus.PENDING) throw new IllegalArgumentException("This leave request has already been reviewed");
        if (!canReview(request, reviewer)) throw new AccessDeniedException("You are not authorized to review this leave request");

        request.setStatus(outcome);
        request.setReviewer(reviewer);
        request.setReviewerComment(input.comment());
        request.setReviewedAt(Instant.now());

        if (outcome == LeaveStatus.APPROVED && Boolean.TRUE.equals(request.getAllowanceEligible())) {
            request.setAllowanceHandoffStatus("PROCESSED_TO_PAYROLL");
        }

        LeaveRequest saved = repository.save(request);
        notifications.notify(request.getStaffProfile().getUser(), "Your leave request was " + outcome.name().toLowerCase(), "/leave");
        return LeaveRequestResponse.from(saved);
    }

    private boolean canReview(LeaveRequest request, User reviewer) {
        if (hasAuthority(reviewer, "STAFF_WRITE")) return true;
        return approverFor(request.getStaffProfile()).map(head -> head.getId().equals(reviewer.getId())).orElse(false);
    }

    private Optional<User> approverFor(StaffProfile profile) {
        if (profile.getOrgUnit() == null) return Optional.empty();
        User head = profile.getOrgUnit().getHead();
        if (head != null && !head.getId().equals(profile.getUser().getId())) return Optional.of(head);
        var parent = profile.getOrgUnit().getParent();
        while (parent != null) {
            if (parent.getHead() != null && !parent.getHead().getId().equals(profile.getUser().getId())) return Optional.of(parent.getHead());
            parent = parent.getParent();
        }
        return Optional.empty();
    }

    private boolean hasAuthority(User user, String authority) {
        return user.getRoles().stream().flatMap(r -> r.getPermissions().stream()).anyMatch(p -> p.getName().equals(authority));
    }

    private StaffProfile profileFor(User user) {
        return staffProfiles.findByUser(user).orElseGet(() -> {
            String staffNum = "STAFF-" + String.format("%04d", user.getId());
            StaffProfile newProfile = StaffProfile.builder()
                    .user(user)
                    .staffNumber(staffNum)
                    .category(StaffCategory.ACADEMIC)
                    .employmentType(EmploymentType.FULL_TIME)
                    .employmentStatus(EmploymentStatus.ACTIVE)
                    .dateOfHire(LocalDate.now())
                    .gradeLevel(10)
                    .gradeStep(1)
                    .designation("Staff Member")
                    .build();
            return staffProfiles.save(newProfile);
        });
    }

    private LeaveRequest find(Long id) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("Leave request not found"));
    }
}
