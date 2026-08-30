package com.uniservice.leave.service;

import com.uniservice.auth.entity.Permission;
import com.uniservice.auth.entity.Role;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.leave.dto.*;
import com.uniservice.leave.entity.LeaveRequest;
import com.uniservice.leave.entity.LeaveStatus;
import com.uniservice.leave.entity.LeaveType;
import com.uniservice.leave.repository.LeaveRequestRepository;
import com.uniservice.notification.service.NotificationService;
import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitType;
import com.uniservice.org.service.OrgUnitService;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.StaffProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveRequestServiceTest {

    @Mock private LeaveRequestRepository repository;
    @Mock private StaffProfileRepository staffProfiles;
    @Mock private UserRepository userRepository;
    @Mock private OrgUnitService orgUnits;
    @Mock private NotificationService notifications;

    private LeaveRequestService service;

    private User staffUser;
    private StaffProfile profile;

    @BeforeEach
    void setUp() {
        service = new LeaveRequestService(repository, staffProfiles, userRepository, orgUnits, notifications);

        staffUser = new User();
        staffUser.setId(1L);
        staffUser.setUsername("jdoe");
        staffUser.setFirstName("Jane");
        staffUser.setLastName("Doe");

        profile = StaffProfile.builder().user(staffUser).staffNumber("STAFF-0001").gradeLevel(10).build();
        profile.setId(5L);

        lenient().when(staffProfiles.findByUser(staffUser)).thenReturn(Optional.of(profile));
    }

    private LeaveRequest request(LeaveStatus status) {
        LeaveRequest r = LeaveRequest.builder()
                .staffProfile(profile)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .numberOfDays(3)
                .reason("Rest")
                .status(status)
                .build();
        r.setId(9L);
        return r;
    }

    // --- getLeaveBalance ---

    @Test
    void getLeaveBalance_gradeBelow7_entitles21Days() {
        profile.setGradeLevel(5);
        when(repository.findByStaffProfileOrderByCreatedAtDesc(profile)).thenReturn(List.of());

        LeaveBalanceResponse balance = service.getLeaveBalance(staffUser);

        assertThat(balance.annualEntitlementDays()).isEqualTo(21);
        assertThat(balance.remainingDaysThisYear()).isEqualTo(21);
    }

    @Test
    void getLeaveBalance_grade7to14_entitles30Days() {
        profile.setGradeLevel(10);
        when(repository.findByStaffProfileOrderByCreatedAtDesc(profile)).thenReturn(List.of());

        LeaveBalanceResponse balance = service.getLeaveBalance(staffUser);

        assertThat(balance.annualEntitlementDays()).isEqualTo(30);
    }

    @Test
    void getLeaveBalance_grade15Plus_entitles42Days() {
        profile.setGradeLevel(16);
        when(repository.findByStaffProfileOrderByCreatedAtDesc(profile)).thenReturn(List.of());

        LeaveBalanceResponse balance = service.getLeaveBalance(staffUser);

        assertThat(balance.annualEntitlementDays()).isEqualTo(42);
    }

    @Test
    void getLeaveBalance_subtractsOnlyApprovedRequestsThisYear() {
        profile.setGradeLevel(10);
        LeaveRequest approvedThisYear = request(LeaveStatus.APPROVED);
        LeaveRequest pending = request(LeaveStatus.PENDING);
        LeaveRequest approvedLastYear = LeaveRequest.builder()
                .staffProfile(profile).leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().minusYears(1)).endDate(LocalDate.now().minusYears(1).plusDays(4))
                .numberOfDays(5).reason("x").status(LeaveStatus.APPROVED).build();
        when(repository.findByStaffProfileOrderByCreatedAtDesc(profile))
                .thenReturn(List.of(approvedThisYear, pending, approvedLastYear));

        LeaveBalanceResponse balance = service.getLeaveBalance(staffUser);

        assertThat(balance.usedDaysThisYear()).isEqualTo(3);
        assertThat(balance.remainingDaysThisYear()).isEqualTo(27);
    }

    // --- create ---

    @Test
    void create_endBeforeStart_throws() {
        CreateLeaveRequest input = new CreateLeaveRequest(LeaveType.ANNUAL, LocalDate.now().plusDays(5), LocalDate.now().plusDays(1), "x", null, null, null);

        assertThatThrownBy(() -> service.create(input, staffUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("End date");
    }

    @Test
    void create_startsInPast_throws() {
        CreateLeaveRequest input = new CreateLeaveRequest(LeaveType.ANNUAL, LocalDate.now().minusDays(1), LocalDate.now().plusDays(1), "x", null, null, null);

        assertThatThrownBy(() -> service.create(input, staffUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("past");
    }

    @Test
    void create_exceedsRemainingBalance_throws() {
        profile.setGradeLevel(10);
        when(repository.findByStaffProfileOrderByCreatedAtDesc(profile)).thenReturn(List.of());
        CreateLeaveRequest input = new CreateLeaveRequest(
                LeaveType.ANNUAL, LocalDate.now().plusDays(1), LocalDate.now().plusDays(40), "x", null, null, null);

        assertThatThrownBy(() -> service.create(input, staffUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds your remaining annual leave balance");
    }

    @Test
    void create_withHandoverOfficer_setsPendingHandoverAndNotifiesThem() {
        profile.setGradeLevel(10);
        when(repository.findByStaffProfileOrderByCreatedAtDesc(profile)).thenReturn(List.of());
        User handover = new User();
        handover.setId(2L);
        handover.setFirstName("Bob");
        when(userRepository.findById(2L)).thenReturn(Optional.of(handover));
        when(repository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateLeaveRequest input = new CreateLeaveRequest(
                LeaveType.ANNUAL, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), "Rest", 2L, "cover my desk", null);

        LeaveRequestResponse result = service.create(input, staffUser);

        assertThat(result.handoverStatus()).isEqualTo("PENDING");
        verify(notifications).notify(eq(handover), contains("handover officer"), eq("/leave"));
    }

    @Test
    void create_withoutHandoverOfficer_handoverNotRequired() {
        profile.setGradeLevel(10);
        when(repository.findByStaffProfileOrderByCreatedAtDesc(profile)).thenReturn(List.of());
        when(repository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateLeaveRequest input = new CreateLeaveRequest(
                LeaveType.ANNUAL, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), "Rest", null, null, null);

        LeaveRequestResponse result = service.create(input, staffUser);

        assertThat(result.handoverStatus()).isEqualTo("NOT_REQUIRED");
    }

    @Test
    void create_withAllowanceRequest_setsPendingPayrollAndAmount() {
        profile.setGradeLevel(10);
        when(repository.findByStaffProfileOrderByCreatedAtDesc(profile)).thenReturn(List.of());
        when(repository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateLeaveRequest input = new CreateLeaveRequest(
                LeaveType.ANNUAL, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), "Rest", null, null, true);

        LeaveRequestResponse result = service.create(input, staffUser);

        assertThat(result.allowanceHandoffStatus()).isEqualTo("PENDING_PAYROLL");
        assertThat(result.allowanceAmount()).isEqualByComparingTo(BigDecimal.valueOf(50000.00));
    }

    @Test
    void create_notifiesApprover() {
        OrgUnit dept = OrgUnit.builder().name("CS").code("CS").type(OrgUnitType.DEPARTMENT).build();
        dept.setId(3L);
        User head = new User();
        head.setId(4L);
        dept.setHead(head);
        profile.setOrgUnit(dept);
        profile.setGradeLevel(10);

        when(repository.findByStaffProfileOrderByCreatedAtDesc(profile)).thenReturn(List.of());
        when(repository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateLeaveRequest input = new CreateLeaveRequest(
                LeaveType.ANNUAL, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), "Rest", null, null, null);

        service.create(input, staffUser);

        verify(notifications).notify(eq(head), contains("awaits your review"), eq("/leave/pending"));
    }

    // --- acceptHandover ---

    @Test
    void acceptHandover_byDesignatedOfficer_setsAccepted() {
        User handoverOfficer = new User();
        handoverOfficer.setId(2L);
        handoverOfficer.setFirstName("Bob");
        handoverOfficer.setLastName("Smith");
        LeaveRequest req = request(LeaveStatus.PENDING);
        req.setHandoverOfficer(handoverOfficer);
        when(repository.findById(9L)).thenReturn(Optional.of(req));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LeaveRequestResponse result = service.acceptHandover(9L, handoverOfficer);

        assertThat(result.handoverStatus()).isEqualTo("ACCEPTED");
        verify(notifications).notify(eq(staffUser), contains("accepted your leave handover"), eq("/leave"));
    }

    @Test
    void acceptHandover_byNonDesignatedUser_throws() {
        User handoverOfficer = new User();
        handoverOfficer.setId(2L);
        LeaveRequest req = request(LeaveStatus.PENDING);
        req.setHandoverOfficer(handoverOfficer);
        when(repository.findById(9L)).thenReturn(Optional.of(req));

        User stranger = new User();
        stranger.setId(99L);

        assertThatThrownBy(() -> service.acceptHandover(9L, stranger))
                .isInstanceOf(AccessDeniedException.class);
    }

    // --- approve / reject ---

    @Test
    void approve_byUserWithStaffWrite_succeeds() {
        LeaveRequest req = request(LeaveStatus.PENDING);
        when(repository.findById(9L)).thenReturn(Optional.of(req));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User hr = new User();
        hr.setId(50L);
        Permission staffWrite = Permission.builder().name("STAFF_WRITE").build();
        Role hrRole = Role.builder().name("HR_ADMIN").permissions(Set.of(staffWrite)).build();
        hr.setRoles(Set.of(hrRole));

        LeaveRequestResponse result = service.approve(9L, new ReviewLeaveRequest("Approved"), hr);

        assertThat(result.status()).isEqualTo(LeaveStatus.APPROVED);
        verify(notifications).notify(eq(staffUser), contains("approved"), eq("/leave"));
    }

    @Test
    void approve_byUnauthorizedUser_throws() {
        LeaveRequest req = request(LeaveStatus.PENDING);
        when(repository.findById(9L)).thenReturn(Optional.of(req));

        User stranger = new User();
        stranger.setId(99L);
        stranger.setRoles(Set.of());

        assertThatThrownBy(() -> service.approve(9L, new ReviewLeaveRequest("x"), stranger))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void approve_alreadyReviewedRequest_throws() {
        LeaveRequest req = request(LeaveStatus.APPROVED);
        when(repository.findById(9L)).thenReturn(Optional.of(req));

        User hr = new User();
        hr.setId(50L);
        Permission staffWrite = Permission.builder().name("STAFF_WRITE").build();
        hr.setRoles(Set.of(Role.builder().name("HR_ADMIN").permissions(Set.of(staffWrite)).build()));

        assertThatThrownBy(() -> service.approve(9L, new ReviewLeaveRequest("x"), hr))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already been reviewed");
    }

    @Test
    void approve_withEligibleAllowance_marksProcessedToPayroll() {
        LeaveRequest req = request(LeaveStatus.PENDING);
        req.setAllowanceEligible(true);
        when(repository.findById(9L)).thenReturn(Optional.of(req));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User hr = new User();
        hr.setId(50L);
        hr.setRoles(Set.of(Role.builder().name("HR_ADMIN").permissions(Set.of(Permission.builder().name("STAFF_WRITE").build())).build()));

        LeaveRequestResponse result = service.approve(9L, new ReviewLeaveRequest("x"), hr);

        assertThat(result.allowanceHandoffStatus()).isEqualTo("PROCESSED_TO_PAYROLL");
    }

    @Test
    void reject_byHeadOfDepartment_succeeds() {
        OrgUnit dept = OrgUnit.builder().name("CS").code("CS").type(OrgUnitType.DEPARTMENT).build();
        dept.setId(3L);
        User head = new User();
        head.setId(4L);
        dept.setHead(head);
        profile.setOrgUnit(dept);

        LeaveRequest req = request(LeaveStatus.PENDING);
        when(repository.findById(9L)).thenReturn(Optional.of(req));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LeaveRequestResponse result = service.reject(9L, new ReviewLeaveRequest("Not enough cover"), head);

        assertThat(result.status()).isEqualTo(LeaveStatus.REJECTED);
    }

    // --- submitResumption / confirmResumption ---

    @Test
    void submitResumption_onOwnApprovedRequest_setsPendingConfirmation() {
        LeaveRequest req = request(LeaveStatus.APPROVED);
        when(repository.findById(9L)).thenReturn(Optional.of(req));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LeaveRequestResponse result = service.submitResumption(9L, new SubmitResumptionRequest(LocalDate.now(), "back to work"), staffUser);

        assertThat(result.resumptionStatus()).isEqualTo("PENDING_CONFIRMATION");
    }

    @Test
    void submitResumption_onSomeoneElsesRequest_throws() {
        LeaveRequest req = request(LeaveStatus.APPROVED);
        when(repository.findById(9L)).thenReturn(Optional.of(req));

        User stranger = new User();
        stranger.setId(99L);

        assertThatThrownBy(() -> service.submitResumption(9L, new SubmitResumptionRequest(LocalDate.now(), null), stranger))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void submitResumption_onNonApprovedRequest_throws() {
        LeaveRequest req = request(LeaveStatus.PENDING);
        when(repository.findById(9L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.submitResumption(9L, new SubmitResumptionRequest(LocalDate.now(), null), staffUser))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void confirmResumption_byAuthorizedReviewer_setsConfirmed() {
        LeaveRequest req = request(LeaveStatus.APPROVED);
        when(repository.findById(9L)).thenReturn(Optional.of(req));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User hr = new User();
        hr.setId(50L);
        hr.setRoles(Set.of(Role.builder().name("HR_ADMIN").permissions(Set.of(Permission.builder().name("STAFF_WRITE").build())).build()));

        LeaveRequestResponse result = service.confirmResumption(9L, hr);

        assertThat(result.resumptionStatus()).isEqualTo("CONFIRMED");
        verify(notifications).notify(eq(staffUser), contains("confirmed"), eq("/leave"));
    }

    @Test
    void confirmResumption_byUnauthorizedUser_throws() {
        LeaveRequest req = request(LeaveStatus.APPROVED);
        when(repository.findById(9L)).thenReturn(Optional.of(req));

        User stranger = new User();
        stranger.setId(99L);
        stranger.setRoles(Set.of());

        assertThatThrownBy(() -> service.confirmResumption(9L, stranger))
                .isInstanceOf(AccessDeniedException.class);
    }

    // --- cancel ---

    @Test
    void cancel_ownPendingRequest_succeeds() {
        LeaveRequest req = request(LeaveStatus.PENDING);
        when(repository.findById(9L)).thenReturn(Optional.of(req));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LeaveRequestResponse result = service.cancel(9L, staffUser);

        assertThat(result.status()).isEqualTo(LeaveStatus.CANCELLED);
    }

    @Test
    void cancel_someoneElsesRequest_throws() {
        LeaveRequest req = request(LeaveStatus.PENDING);
        when(repository.findById(9L)).thenReturn(Optional.of(req));

        User stranger = new User();
        stranger.setId(99L);

        assertThatThrownBy(() -> service.cancel(9L, stranger)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void cancel_nonPendingRequest_throws() {
        LeaveRequest req = request(LeaveStatus.APPROVED);
        when(repository.findById(9L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.cancel(9L, staffUser)).isInstanceOf(IllegalArgumentException.class);
    }
}
