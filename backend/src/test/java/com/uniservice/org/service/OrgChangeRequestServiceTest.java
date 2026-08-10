package com.uniservice.org.service;

import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.notification.service.NotificationService;
import com.uniservice.org.dto.SubmitChangeRequestRequest;
import com.uniservice.org.entity.*;
import com.uniservice.org.repository.OrgUnitChangeRequestRepository;
import com.uniservice.org.repository.OrgUnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrgChangeRequestServiceTest {

    @Mock private OrgUnitRepository orgUnitRepository;
    @Mock private OrgUnitChangeRequestRepository changeRequestRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private RoleSyncService roleSyncService;
    @Mock private OrgUnitService orgUnitService;

    private OrgChangeRequestService service;

    private User requester;
    private User admin;
    private User reviewer;

    @BeforeEach
    void setUp() {
        service = new OrgChangeRequestService(orgUnitRepository, changeRequestRepository, userRepository,
                notificationService, roleSyncService, orgUnitService);

        requester = new User();
        requester.setId(1L);
        requester.setUsername("hr.director");

        admin = new User();
        admin.setId(2L);
        admin.setUsername("admin");

        reviewer = new User();
        reviewer.setId(3L);
        reviewer.setUsername("admin");
    }

    private void stubChangeRequestSaveEchoesArgument() {
        when(changeRequestRepository.save(any(OrgUnitChangeRequest.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private SubmitChangeRequestRequest createRequest(String name, String code, OrgUnitType type, Long parentId) {
        SubmitChangeRequestRequest r = new SubmitChangeRequestRequest();
        r.setAction(ChangeRequestAction.CREATE);
        r.setProposedName(name);
        r.setProposedCode(code);
        r.setProposedType(type);
        r.setProposedParentId(parentId);
        return r;
    }

    private OrgUnit orgUnit(long id, String name, String code, OrgUnitType type, OrgUnitStatus status, OrgUnit parent) {
        OrgUnit unit = OrgUnit.builder().name(name).code(code).type(type).status(status).parent(parent).build();
        unit.setId(id);
        return unit;
    }

    @Test
    void submit_create_college_succeeds_and_notifiesAdmins() {
        stubChangeRequestSaveEchoesArgument();
        when(orgUnitRepository.findByCodeIgnoreCaseAndStatus("ENGIN", OrgUnitStatus.ACTIVE)).thenReturn(Optional.empty());
        when(userRepository.findByRoles_NameAndEnabledTrue("SYSTEM_ADMIN")).thenReturn(List.of(admin));

        OrgUnitChangeRequest result = service.submit(createRequest("Engineering", null, OrgUnitType.COLLEGE, null), requester);

        assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.PENDING);
        assertThat(result.getAction()).isEqualTo(ChangeRequestAction.CREATE);
        assertThat(result.getProposedName()).isEqualTo("Engineering");
        assertThat(result.getProposedCode()).isEqualTo("ENGIN");
        assertThat(result.getRequestedBy()).isEqualTo(requester);
        verify(notificationService).notify(eq(admin), anyString(), eq("/organization/approvals"));
    }

    @Test
    void submit_create_college_withParent_throws() {
        SubmitChangeRequestRequest r = createRequest("Engineering", null, OrgUnitType.COLLEGE, 5L);

        assertThatThrownBy(() -> service.submit(r, requester))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("A COLLEGE cannot have a parent");
    }

    @Test
    void submit_create_faculty_withoutParent_throws() {
        SubmitChangeRequestRequest r = createRequest("Engineering", null, OrgUnitType.FACULTY, null);

        assertThatThrownBy(() -> service.submit(r, requester))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("parent is required");
    }

    @Test
    void submit_create_faculty_requiresCollegeParent_andGeneratesCode() {
        stubChangeRequestSaveEchoesArgument();
        OrgUnit college = orgUnit(50L, "College of Engineering", "COE", OrgUnitType.COLLEGE, OrgUnitStatus.ACTIVE, null);
        when(orgUnitRepository.findById(50L)).thenReturn(Optional.of(college));
        when(orgUnitRepository.findByCodeIgnoreCaseAndStatus("ENGIN", OrgUnitStatus.ACTIVE)).thenReturn(Optional.empty());
        when(userRepository.findByRoles_NameAndEnabledTrue("SYSTEM_ADMIN")).thenReturn(List.of(admin));

        OrgUnitChangeRequest result =
                service.submit(createRequest("Engineering", null, OrgUnitType.FACULTY, 50L), requester);

        assertThat(result.getProposedCode()).isEqualTo("ENGIN");
        assertThat(result.getProposedParent()).isEqualTo(college);
    }

    @Test
    void submit_create_faculty_withNonCollegeParent_throws() {
        OrgUnit wrongTypeParent = orgUnit(53L, "Some Faculty", "SF", OrgUnitType.FACULTY, OrgUnitStatus.ACTIVE, null);
        when(orgUnitRepository.findById(53L)).thenReturn(Optional.of(wrongTypeParent));

        SubmitChangeRequestRequest r = createRequest("Engineering", null, OrgUnitType.FACULTY, 53L);

        assertThatThrownBy(() -> service.submit(r, requester))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must be a COLLEGE");
    }

    @Test
    void submit_create_faculty_generatesInitialsFromMultiWordName() {
        stubChangeRequestSaveEchoesArgument();
        OrgUnit college = orgUnit(51L, "College", "COL", OrgUnitType.COLLEGE, OrgUnitStatus.ACTIVE, null);
        when(orgUnitRepository.findById(51L)).thenReturn(Optional.of(college));
        when(orgUnitRepository.findByCodeIgnoreCaseAndStatus("FE", OrgUnitStatus.ACTIVE)).thenReturn(Optional.empty());
        when(userRepository.findByRoles_NameAndEnabledTrue("SYSTEM_ADMIN")).thenReturn(List.of(admin));

        OrgUnitChangeRequest result =
                service.submit(createRequest("Faculty of Engineering", null, OrgUnitType.FACULTY, 51L), requester);

        assertThat(result.getProposedCode()).isEqualTo("FE");
    }

    @Test
    void submit_create_faculty_retriesGeneratedCodeOnCollision() {
        stubChangeRequestSaveEchoesArgument();
        OrgUnit college = orgUnit(52L, "College", "COL", OrgUnitType.COLLEGE, OrgUnitStatus.ACTIVE, null);
        when(orgUnitRepository.findById(52L)).thenReturn(Optional.of(college));
        OrgUnit existing = orgUnit(21L, "Existing Engineering", "ENGIN", OrgUnitType.FACULTY, OrgUnitStatus.ACTIVE, college);
        when(orgUnitRepository.findByCodeIgnoreCaseAndStatus("ENGIN", OrgUnitStatus.ACTIVE)).thenReturn(Optional.of(existing));
        when(orgUnitRepository.findByCodeIgnoreCaseAndStatus("ENGIN2", OrgUnitStatus.ACTIVE)).thenReturn(Optional.empty());
        when(userRepository.findByRoles_NameAndEnabledTrue("SYSTEM_ADMIN")).thenReturn(List.of(admin));

        OrgUnitChangeRequest result =
                service.submit(createRequest("Engineering", null, OrgUnitType.FACULTY, 52L), requester);

        assertThat(result.getProposedCode()).isEqualTo("ENGIN2");
    }

    @Test
    void submit_create_department_without_parent_throws() {
        SubmitChangeRequestRequest r = createRequest("CS", "CS", OrgUnitType.DEPARTMENT, null);

        assertThatThrownBy(() -> service.submit(r, requester))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("parent is required");
    }

    @Test
    void submit_create_department_withoutCode_throws() {
        SubmitChangeRequestRequest r = createRequest("Computer Science", null, OrgUnitType.DEPARTMENT, 16L);

        assertThatThrownBy(() -> service.submit(r, requester))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Code is required");
    }

    @Test
    void submit_create_department_duplicateActiveCode_throws() {
        OrgUnit parentFaculty = orgUnit(15L, "Engineering", "ENG", OrgUnitType.FACULTY, OrgUnitStatus.ACTIVE, null);
        when(orgUnitRepository.findById(15L)).thenReturn(Optional.of(parentFaculty));

        OrgUnit existing = orgUnit(9L, "Existing Dept", "CS", OrgUnitType.DEPARTMENT, OrgUnitStatus.ACTIVE, parentFaculty);
        when(orgUnitRepository.findByCodeIgnoreCaseAndStatus("CS", OrgUnitStatus.ACTIVE)).thenReturn(Optional.of(existing));

        SubmitChangeRequestRequest r = createRequest("Computer Science", "CS", OrgUnitType.DEPARTMENT, 15L);

        assertThatThrownBy(() -> service.submit(r, requester))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already in use");
    }

    @Test
    void submit_create_department_withArchivedParent_throws() {
        OrgUnit archivedFaculty = orgUnit(10L, "Old Faculty", "OLD", OrgUnitType.FACULTY, OrgUnitStatus.ARCHIVED, null);
        when(orgUnitRepository.findById(10L)).thenReturn(Optional.of(archivedFaculty));

        SubmitChangeRequestRequest r = createRequest("CS", "CS", OrgUnitType.DEPARTMENT, 10L);

        assertThatThrownBy(() -> service.submit(r, requester))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("archived");
    }

    @Test
    void submit_create_department_withWrongParentType_throws() {
        OrgUnit wrongTypeParent = orgUnit(11L, "Some Dept", "SD", OrgUnitType.DEPARTMENT, OrgUnitStatus.ACTIVE, null);
        when(orgUnitRepository.findById(11L)).thenReturn(Optional.of(wrongTypeParent));

        SubmitChangeRequestRequest r = createRequest("Sub Unit", "SU", OrgUnitType.DEPARTMENT, 11L);

        assertThatThrownBy(() -> service.submit(r, requester))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must be a FACULTY");
    }

    @Test
    void submit_update_withNoChangedFields_throws() {
        OrgUnit target = orgUnit(20L, "Engineering", "ENG", OrgUnitType.FACULTY, OrgUnitStatus.ACTIVE, null);
        when(orgUnitRepository.findById(20L)).thenReturn(Optional.of(target));

        SubmitChangeRequestRequest r = new SubmitChangeRequestRequest();
        r.setAction(ChangeRequestAction.UPDATE);
        r.setTargetOrgUnitId(20L);

        assertThatThrownBy(() -> service.submit(r, requester))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("At least one field");
    }

    @Test
    void submit_archive_withActiveChildren_throws() {
        OrgUnit target = orgUnit(30L, "Engineering", "ENG", OrgUnitType.FACULTY, OrgUnitStatus.ACTIVE, null);
        OrgUnit child = orgUnit(31L, "CS", "CS", OrgUnitType.DEPARTMENT, OrgUnitStatus.ACTIVE, target);
        when(orgUnitRepository.findById(30L)).thenReturn(Optional.of(target));
        when(orgUnitRepository.findByParentAndStatus(target, OrgUnitStatus.ACTIVE)).thenReturn(List.of(child));

        SubmitChangeRequestRequest r = new SubmitChangeRequestRequest();
        r.setAction(ChangeRequestAction.ARCHIVE);
        r.setTargetOrgUnitId(30L);

        assertThatThrownBy(() -> service.submit(r, requester))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("active children");
    }

    @Test
    void approve_create_appliesChange_andNotifiesRequester() {
        OrgUnitChangeRequest pending = OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.CREATE)
                .proposedName("Engineering")
                .proposedCode("ENG")
                .proposedType(OrgUnitType.FACULTY)
                .status(ChangeRequestStatus.PENDING)
                .requestedBy(requester)
                .build();
        pending.setId(100L);

        stubChangeRequestSaveEchoesArgument();
        when(changeRequestRepository.findById(100L)).thenReturn(Optional.of(pending));
        when(orgUnitRepository.findByCodeIgnoreCaseAndStatus("ENG", OrgUnitStatus.ACTIVE)).thenReturn(Optional.empty());

        OrgUnitChangeRequest result = service.approve(100L, reviewer, "Looks good");

        assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.APPROVED);
        assertThat(result.getReviewedBy()).isEqualTo(reviewer);
        assertThat(result.getReviewNotes()).isEqualTo("Looks good");
        verify(orgUnitRepository).save(argThat(u -> "Engineering".equals(u.getName()) && "ENG".equals(u.getCode())));
        verify(notificationService).notify(eq(requester), contains("approved"), eq("/organization/my-requests"));
        verify(changeRequestRepository, never()).findByTargetOrgUnitAndStatusAndIdNot(any(), any(), any());
    }

    @Test
    void approve_update_supersedesOtherPendingRequestsForSameTarget() {
        OrgUnit target = orgUnit(40L, "Engineering", "ENG", OrgUnitType.FACULTY, OrgUnitStatus.ACTIVE, null);

        OrgUnitChangeRequest pending = OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.UPDATE)
                .targetOrgUnit(target)
                .proposedName("Engineering & Tech")
                .status(ChangeRequestStatus.PENDING)
                .requestedBy(requester)
                .build();
        pending.setId(200L);

        User otherRequester = new User();
        otherRequester.setId(5L);
        otherRequester.setUsername("registrar");
        OrgUnitChangeRequest otherPending = OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.UPDATE)
                .targetOrgUnit(target)
                .proposedCode("ENGX")
                .status(ChangeRequestStatus.PENDING)
                .requestedBy(otherRequester)
                .build();
        otherPending.setId(201L);

        stubChangeRequestSaveEchoesArgument();
        when(changeRequestRepository.findById(200L)).thenReturn(Optional.of(pending));
        when(changeRequestRepository.findByTargetOrgUnitAndStatusAndIdNot(target, ChangeRequestStatus.PENDING, 200L))
                .thenReturn(List.of(otherPending));

        service.approve(200L, reviewer, null);

        assertThat(otherPending.getStatus()).isEqualTo(ChangeRequestStatus.REJECTED);
        assertThat(otherPending.getReviewNotes()).contains("Superseded");
        verify(notificationService).notify(eq(requester), contains("approved"), anyString());
        verify(notificationService).notify(eq(otherRequester), contains("superseded"), anyString());
    }

    @Test
    void reject_withBlankNotes_throws() {
        assertThatThrownBy(() -> service.reject(300L, reviewer, "  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Review notes are required");

        verifyNoInteractions(changeRequestRepository);
    }

    @Test
    void approve_update_headChange_capturesOldHeadAndCallsRoleSync() {
        User oldHead = new User();
        oldHead.setId(6L);
        oldHead.setUsername("old.head");
        User newHead = new User();
        newHead.setId(7L);
        newHead.setUsername("new.head");

        OrgUnit target = orgUnit(40L, "Engineering", "ENG", OrgUnitType.FACULTY, OrgUnitStatus.ACTIVE, null);
        target.setHead(oldHead);

        OrgUnitChangeRequest pending = OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.UPDATE)
                .targetOrgUnit(target)
                .proposedHead(newHead)
                .status(ChangeRequestStatus.PENDING)
                .requestedBy(requester)
                .build();
        pending.setId(210L);

        stubChangeRequestSaveEchoesArgument();
        when(changeRequestRepository.findById(210L)).thenReturn(Optional.of(pending));
        when(changeRequestRepository.findByTargetOrgUnitAndStatusAndIdNot(target, ChangeRequestStatus.PENDING, 210L))
                .thenReturn(List.of());

        service.approve(210L, reviewer, "ok");

        assertThat(target.getHead()).isEqualTo(newHead);
        verify(roleSyncService).onHeadChanged(oldHead, newHead, target);
    }

    @Test
    void approve_create_withHead_callsRoleSyncReconcile() {
        User head = new User();
        head.setId(8L);
        head.setUsername("new.dept.head");

        OrgUnitChangeRequest pending = OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.CREATE)
                .proposedName("Engineering")
                .proposedCode("ENG")
                .proposedType(OrgUnitType.FACULTY)
                .proposedHead(head)
                .status(ChangeRequestStatus.PENDING)
                .requestedBy(requester)
                .build();
        pending.setId(101L);

        stubChangeRequestSaveEchoesArgument();
        when(changeRequestRepository.findById(101L)).thenReturn(Optional.of(pending));
        when(orgUnitRepository.findByCodeIgnoreCaseAndStatus("ENG", OrgUnitStatus.ACTIVE)).thenReturn(Optional.empty());

        service.approve(101L, reviewer, null);

        verify(roleSyncService).reconcileHeadshipRoles(head);
    }

    @Test
    void approve_create_withIsHrUnit_designatesHrUnitAndResyncsAll() {
        OrgUnitChangeRequest pending = OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.CREATE)
                .proposedName("HR")
                .proposedCode("HR")
                .proposedType(OrgUnitType.DEPARTMENT)
                .proposedIsHrUnit(true)
                .status(ChangeRequestStatus.PENDING)
                .requestedBy(requester)
                .build();
        pending.setId(102L);

        stubChangeRequestSaveEchoesArgument();
        when(changeRequestRepository.findById(102L)).thenReturn(Optional.of(pending));
        when(orgUnitRepository.findByCodeIgnoreCaseAndStatus("HR", OrgUnitStatus.ACTIVE)).thenReturn(Optional.empty());

        service.approve(102L, reviewer, null);

        verify(orgUnitService).reassignHrUnit(any(OrgUnit.class));
        verify(roleSyncService).resyncAllHeadshipRoles();
        verify(roleSyncService).resyncAllHrStaffRoles();
    }

    @Test
    void reject_success_notifiesRequester() {
        OrgUnitChangeRequest pending = OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.CREATE)
                .status(ChangeRequestStatus.PENDING)
                .requestedBy(requester)
                .build();
        pending.setId(300L);
        stubChangeRequestSaveEchoesArgument();
        when(changeRequestRepository.findById(300L)).thenReturn(Optional.of(pending));

        OrgUnitChangeRequest result = service.reject(300L, reviewer, "Budget not approved");

        assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.REJECTED);
        assertThat(result.getReviewNotes()).isEqualTo("Budget not approved");
        verify(notificationService).notify(eq(requester), contains("Budget not approved"), anyString());
    }
}
