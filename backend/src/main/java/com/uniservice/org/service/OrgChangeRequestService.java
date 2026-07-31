package com.uniservice.org.service;

import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.notification.service.NotificationService;
import com.uniservice.org.dto.SubmitChangeRequestRequest;
import com.uniservice.org.entity.*;
import com.uniservice.org.repository.OrgUnitChangeRequestRepository;
import com.uniservice.org.repository.OrgUnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrgChangeRequestService {

    private static final Set<String> CODE_STOPWORDS = Set.of("of", "the", "and", "for", "in", "&");

    private static final String APPROVALS_LINK = "/organization/approvals";
    private static final String MY_REQUESTS_LINK = "/organization/my-requests";

    private final OrgUnitRepository orgUnitRepository;
    private final OrgUnitChangeRequestRepository changeRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final RoleSyncService roleSyncService;
    private final OrgUnitService orgUnitService;

    @Transactional
    public OrgUnitChangeRequest submit(SubmitChangeRequestRequest request, User requester) {
        OrgUnitChangeRequest changeRequest = switch (request.getAction()) {
            case CREATE -> buildCreateRequest(request);
            case UPDATE -> buildUpdateRequest(request);
            case ARCHIVE -> buildArchiveRequest(request);
        };
        changeRequest.setRequestedBy(requester);
        changeRequest.setStatus(ChangeRequestStatus.PENDING);

        OrgUnitChangeRequest saved = changeRequestRepository.save(changeRequest);

        for (User admin : userRepository.findByRoles_NameAndEnabledTrue("SYSTEM_ADMIN")) {
            notificationService.notify(admin,
                    "New organization change request from " + requester.getUsername(), APPROVALS_LINK);
        }
        return saved;
    }

    @Transactional
    public OrgUnitChangeRequest approve(Long requestId, User reviewer, String notes) {
        OrgUnitChangeRequest request = changeRequestRepository.findById(requestId).orElseThrow();
        if (request.getStatus() != ChangeRequestStatus.PENDING) {
            throw new IllegalArgumentException("This request is not pending");
        }

        applyChange(request);

        request.setStatus(ChangeRequestStatus.APPROVED);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(Instant.now());
        request.setReviewNotes(notes);
        changeRequestRepository.save(request);

        supersedeOtherPendingRequests(request, reviewer);

        notificationService.notify(request.getRequestedBy(), "Your organization change request was approved.", MY_REQUESTS_LINK);
        return request;
    }

    @Transactional
    public OrgUnitChangeRequest reject(Long requestId, User reviewer, String notes) {
        if (!StringUtils.hasText(notes)) {
            throw new IllegalArgumentException("Review notes are required when rejecting a request");
        }

        OrgUnitChangeRequest request = changeRequestRepository.findById(requestId).orElseThrow();
        if (request.getStatus() != ChangeRequestStatus.PENDING) {
            throw new IllegalArgumentException("This request is not pending");
        }

        request.setStatus(ChangeRequestStatus.REJECTED);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(Instant.now());
        request.setReviewNotes(notes);
        changeRequestRepository.save(request);

        notificationService.notify(request.getRequestedBy(),
                "Your organization change request was rejected: " + notes, MY_REQUESTS_LINK);
        return request;
    }

    public List<OrgUnitChangeRequest> listPending() {
        return changeRequestRepository.findByStatusOrderByCreatedAtAsc(ChangeRequestStatus.PENDING);
    }

    public List<OrgUnitChangeRequest> listMine(User requester) {
        return changeRequestRepository.findByRequestedByOrderByCreatedAtDesc(requester);
    }

    // --- submission-time request building + validation ---

    private OrgUnitChangeRequest buildCreateRequest(SubmitChangeRequestRequest request) {
        String name = request.getProposedName();
        OrgUnitType type = request.getProposedType();

        if (!StringUtils.hasText(name) || type == null) {
            throw new IllegalArgumentException("Name and type are required to create an org unit");
        }

        String code;
        if (type == OrgUnitType.COLLEGE || type == OrgUnitType.FACULTY) {
            // College and Faculty codes are system-generated from the name rather than typed by hand.
            code = generateCodeFromName(name);
        } else {
            code = request.getProposedCode();
            if (!StringUtils.hasText(code)) {
                throw new IllegalArgumentException("Code is required to create a " + type);
            }
        }

        OrgUnit parent = resolveParentForType(type, request.getProposedParentId());
        assertCodeAvailable(code, null);

        User head = resolveOptionalUser(request.getProposedHeadId());

        return OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.CREATE)
                .proposedName(name)
                .proposedCode(code)
                .proposedType(type)
                .proposedParent(parent)
                .proposedHead(head)
                .proposedIsHrUnit(Boolean.TRUE.equals(request.getProposedIsHrUnit()) ? Boolean.TRUE : null)
                .build();
    }

    private OrgUnitChangeRequest buildUpdateRequest(SubmitChangeRequestRequest request) {
        if (request.getTargetOrgUnitId() == null) {
            throw new IllegalArgumentException("A target org unit is required to update");
        }
        if (request.getProposedType() != null || request.getProposedParentId() != null) {
            throw new IllegalArgumentException("Changing type or parent is not supported yet");
        }

        OrgUnit target = orgUnitRepository.findById(request.getTargetOrgUnitId())
                .orElseThrow(() -> new IllegalArgumentException("Org unit not found"));
        if (target.getStatus() != OrgUnitStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot update an archived org unit");
        }

        boolean hasName = StringUtils.hasText(request.getProposedName());
        boolean hasCode = StringUtils.hasText(request.getProposedCode());
        boolean hasHead = request.getProposedHeadId() != null;
        boolean hasIsHrUnit = request.getProposedIsHrUnit() != null;
        if (!hasName && !hasCode && !hasHead && !hasIsHrUnit) {
            throw new IllegalArgumentException("At least one field (name, code, head, or HR designation) must change");
        }

        if (hasCode) {
            assertCodeAvailable(request.getProposedCode(), target.getId());
        }

        User head = hasHead ? resolveOptionalUser(request.getProposedHeadId()) : null;

        return OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.UPDATE)
                .targetOrgUnit(target)
                .proposedName(hasName ? request.getProposedName() : null)
                .proposedCode(hasCode ? request.getProposedCode() : null)
                .proposedHead(head)
                .proposedIsHrUnit(hasIsHrUnit ? request.getProposedIsHrUnit() : null)
                .build();
    }

    private OrgUnitChangeRequest buildArchiveRequest(SubmitChangeRequestRequest request) {
        if (request.getTargetOrgUnitId() == null) {
            throw new IllegalArgumentException("A target org unit is required to archive");
        }
        OrgUnit target = orgUnitRepository.findById(request.getTargetOrgUnitId())
                .orElseThrow(() -> new IllegalArgumentException("Org unit not found"));
        if (target.getStatus() != OrgUnitStatus.ACTIVE) {
            throw new IllegalArgumentException("This org unit is already archived");
        }
        assertNoActiveChildren(target);

        return OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.ARCHIVE)
                .targetOrgUnit(target)
                .build();
    }

    // College -> Faculty -> Department -> Unit. COLLEGE is the only type without a parent.
    private static final Map<OrgUnitType, OrgUnitType> EXPECTED_PARENT_TYPE = Map.of(
            OrgUnitType.FACULTY, OrgUnitType.COLLEGE,
            OrgUnitType.DEPARTMENT, OrgUnitType.FACULTY,
            OrgUnitType.UNIT, OrgUnitType.DEPARTMENT
    );

    private OrgUnit resolveParentForType(OrgUnitType type, Long parentId) {
        if (type == OrgUnitType.COLLEGE) {
            if (parentId != null) {
                throw new IllegalArgumentException("A COLLEGE cannot have a parent");
            }
            return null;
        }

        if (parentId == null) {
            throw new IllegalArgumentException("A parent is required for a " + type);
        }
        OrgUnit parent = orgUnitRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent org unit not found"));
        if (parent.getStatus() != OrgUnitStatus.ACTIVE) {
            throw new IllegalArgumentException("Parent org unit is archived");
        }

        OrgUnitType expectedParentType = EXPECTED_PARENT_TYPE.get(type);
        if (parent.getType() != expectedParentType) {
            throw new IllegalArgumentException("A " + type + "'s parent must be a " + expectedParentType);
        }
        return parent;
    }

    private String generateCodeFromName(String name) {
        String base = deriveCodeBase(name);
        String candidate = base;
        int suffix = 2;
        while (orgUnitRepository.findByCodeIgnoreCaseAndStatus(candidate, OrgUnitStatus.ACTIVE).isPresent()) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    private String deriveCodeBase(String name) {
        List<String> words = Arrays.stream(name.trim().split("\\s+"))
                .map(w -> w.replaceAll("[^A-Za-z]", ""))
                .filter(w -> !w.isEmpty() && !CODE_STOPWORDS.contains(w.toLowerCase()))
                .toList();

        if (words.isEmpty()) {
            return "ORG";
        }
        if (words.size() == 1) {
            String word = words.get(0).toUpperCase();
            return word.length() <= 5 ? word : word.substring(0, 5);
        }
        String initials = words.stream().map(w -> w.substring(0, 1).toUpperCase()).collect(Collectors.joining());
        return initials.length() <= 10 ? initials : initials.substring(0, 10);
    }

    private void assertCodeAvailable(String code, Long excludingOrgUnitId) {
        orgUnitRepository.findByCodeIgnoreCaseAndStatus(code, OrgUnitStatus.ACTIVE)
                .filter(existing -> !existing.getId().equals(excludingOrgUnitId))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Code '" + code + "' is already in use by an active org unit");
                });
    }

    private void assertNoActiveChildren(OrgUnit target) {
        if (!orgUnitRepository.findByParentAndStatus(target, OrgUnitStatus.ACTIVE).isEmpty()) {
            throw new IllegalArgumentException("Cannot archive an org unit that has active children");
        }
    }

    private User resolveOptionalUser(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Head user not found"));
    }

    // --- approval-time re-validation + apply ---

    private void applyChange(OrgUnitChangeRequest request) {
        switch (request.getAction()) {
            case CREATE -> applyCreate(request);
            case UPDATE -> applyUpdate(request);
            case ARCHIVE -> applyArchive(request);
        }
    }

    private void applyCreate(OrgUnitChangeRequest request) {
        OrgUnit parent = request.getProposedParent();
        if (parent != null && parent.getStatus() != OrgUnitStatus.ACTIVE) {
            throw new IllegalArgumentException("Parent org unit is archived");
        }
        assertCodeAvailable(request.getProposedCode(), null);

        OrgUnit newUnit = OrgUnit.builder()
                .name(request.getProposedName())
                .code(request.getProposedCode())
                .type(request.getProposedType())
                .parent(parent)
                .head(request.getProposedHead())
                .status(OrgUnitStatus.ACTIVE)
                .build();
        orgUnitRepository.save(newUnit);

        if (Boolean.TRUE.equals(request.getProposedIsHrUnit())) {
            orgUnitService.reassignHrUnit(newUnit);
            roleSyncService.resyncAllHeadshipRoles();
            roleSyncService.resyncAllHrStaffRoles();
        } else if (newUnit.getHead() != null) {
            roleSyncService.reconcileHeadshipRoles(newUnit.getHead());
        }
    }

    private void applyUpdate(OrgUnitChangeRequest request) {
        OrgUnit target = request.getTargetOrgUnit();
        if (target.getStatus() != OrgUnitStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot update an archived org unit");
        }
        if (StringUtils.hasText(request.getProposedCode())) {
            assertCodeAvailable(request.getProposedCode(), target.getId());
            target.setCode(request.getProposedCode());
        }
        if (StringUtils.hasText(request.getProposedName())) {
            target.setName(request.getProposedName());
        }

        User previousHead = target.getHead();
        boolean headChanged = request.getProposedHead() != null;
        if (headChanged) {
            target.setHead(request.getProposedHead());
        }
        orgUnitRepository.save(target);

        if (headChanged) {
            roleSyncService.onHeadChanged(previousHead, target.getHead(), target);
        }

        if (request.getProposedIsHrUnit() != null) {
            if (request.getProposedIsHrUnit()) {
                orgUnitService.reassignHrUnit(target);
            } else {
                orgUnitService.clearHrUnit(target);
            }
            roleSyncService.resyncAllHeadshipRoles();
            roleSyncService.resyncAllHrStaffRoles();
        }
    }

    private void applyArchive(OrgUnitChangeRequest request) {
        OrgUnit target = request.getTargetOrgUnit();
        if (target.getStatus() != OrgUnitStatus.ACTIVE) {
            throw new IllegalArgumentException("This org unit is already archived");
        }
        assertNoActiveChildren(target);

        boolean wasHrUnit = target.isHrUnit();
        target.setStatus(OrgUnitStatus.ARCHIVED);
        orgUnitRepository.save(target);

        roleSyncService.onOrgUnitArchived(target);
        if (wasHrUnit) {
            orgUnitService.clearHrUnit(target);
            roleSyncService.resyncAllHeadshipRoles();
            roleSyncService.resyncAllHrStaffRoles();
        }
    }

    private void supersedeOtherPendingRequests(OrgUnitChangeRequest approvedRequest, User reviewer) {
        if (approvedRequest.getTargetOrgUnit() == null) {
            return;
        }
        List<OrgUnitChangeRequest> others = changeRequestRepository.findByTargetOrgUnitAndStatusAndIdNot(
                approvedRequest.getTargetOrgUnit(), ChangeRequestStatus.PENDING, approvedRequest.getId());

        for (OrgUnitChangeRequest other : others) {
            other.setStatus(ChangeRequestStatus.REJECTED);
            other.setReviewedBy(reviewer);
            other.setReviewedAt(Instant.now());
            other.setReviewNotes("Superseded by another approved change to this unit.");
            changeRequestRepository.save(other);
            notificationService.notify(other.getRequestedBy(),
                    "Your organization change request was superseded by another approved change.", MY_REQUESTS_LINK);
        }
    }
}
