package com.uniservice.appraisal.service;

import com.uniservice.appraisal.dto.*;
import com.uniservice.appraisal.entity.*;
import com.uniservice.appraisal.repository.AppraisalCycleRepository;
import com.uniservice.appraisal.repository.AppraisalFormRepository;
import com.uniservice.appraisal.repository.AppraisalSickLeaveRepository;
import com.uniservice.auth.entity.User;
import com.uniservice.notification.service.NotificationService;
import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitStatus;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppraisalServiceTest {

    @Mock private AppraisalCycleRepository cycleRepository;
    @Mock private AppraisalFormRepository formRepository;
    @Mock private AppraisalSickLeaveRepository sickLeaveRepository;
    @Mock private StaffProfileRepository staffProfileRepository;
    @Mock private NotificationService notificationService;
    @Mock private OrgUnitService orgUnitService;

    private AppraisalService service;

    private User staffUser;
    private User unitHeadUser;
    private User deptHeadUser;
    private StaffProfile staffProfile;
    private OrgUnit department;
    private OrgUnit unit;

    @BeforeEach
    void setUp() {
        service = new AppraisalService(cycleRepository, formRepository, sickLeaveRepository, staffProfileRepository,
                notificationService, orgUnitService);

        staffUser = user(1L, "jdoe");
        unitHeadUser = user(2L, "unithead");
        deptHeadUser = user(3L, "depthead");

        department = OrgUnit.builder().name("Computer Science").code("CS").type(OrgUnitType.DEPARTMENT)
                .status(OrgUnitStatus.ACTIVE).head(deptHeadUser).build();
        department.setId(10L);
        unit = OrgUnit.builder().name("Networking Lab").code("NETLAB").type(OrgUnitType.UNIT)
                .status(OrgUnitStatus.ACTIVE).parent(department).head(unitHeadUser).build();
        unit.setId(11L);

        staffProfile = StaffProfile.builder().user(staffUser).staffNumber("STAFF-0001")
                .orgUnit(unit).dateOfHire(LocalDate.of(2020, 1, 1)).build();
        staffProfile.setId(100L);
    }

    private User user(long id, String username) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setFirstName("F");
        u.setLastName("L");
        return u;
    }

    private AppraisalCycle cycle(long id, int year, AppraisalCycleStatus status) {
        AppraisalCycle c = AppraisalCycle.builder().year(year).status(status).build();
        c.setId(id);
        return c;
    }

    private AppraisalForm form(long id, AppraisalCycle cycle, StaffProfile profile, AppraisalStatus status) {
        AppraisalForm f = AppraisalForm.builder().cycle(cycle).staffProfile(profile).status(status).build();
        f.setId(id);
        return f;
    }

    private UnitHeadReviewRequest validUnitHeadReviewRequest() {
        UnitHeadReviewRequest req = new UnitHeadReviewRequest();
        req.setRatingQualityOfWork(4);
        req.setRatingKnowledgeOfWork(4);
        req.setRatingPerformanceUnderStress(4);
        req.setRatingInitiative(4);
        req.setRatingAdaptability(4);
        req.setRatingResourcefulness(4);
        req.setRatingTeamSpirit(4);
        req.setRatingJobPresence(4);
        req.setRatingAdministrativeAbility(4);
        req.setRatingAttitudeToWork(4);
        req.setRatingKnowledgeOfIct(4);
        req.setRatingPunctuality(4);
        req.setRatingAppearance(4);
        req.setOverallGrading(OverallGrading.VERY_GOOD);
        req.setPromotability(Promotability.FITTED);
        return req;
    }

    @Test
    void createCycle_duplicateYear_throws() {
        when(cycleRepository.findByYear(2026)).thenReturn(Optional.of(cycle(1L, 2026, AppraisalCycleStatus.OPEN)));
        CreateAppraisalCycleRequest r = new CreateAppraisalCycleRequest();
        r.setYear(2026);

        assertThatThrownBy(() -> service.createCycle(r))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void createCycle_succeeds() {
        when(cycleRepository.findByYear(2026)).thenReturn(Optional.empty());
        when(cycleRepository.save(any())).thenAnswer(inv -> {
            AppraisalCycle c = inv.getArgument(0);
            c.setId(5L);
            return c;
        });
        CreateAppraisalCycleRequest r = new CreateAppraisalCycleRequest();
        r.setYear(2026);

        AppraisalCycleResponse result = service.createCycle(r);

        assertThat(result.id()).isEqualTo(5L);
        assertThat(result.year()).isEqualTo(2026);
        assertThat(result.status()).isEqualTo(AppraisalCycleStatus.OPEN);
    }

    @Test
    void getOrCreateMine_createsNewDraftForm_whenNoneExists() {
        AppraisalCycle openCycle = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        when(cycleRepository.findById(1L)).thenReturn(Optional.of(openCycle));
        when(staffProfileRepository.findByUser(staffUser)).thenReturn(Optional.of(staffProfile));
        when(formRepository.findByCycleAndStaffProfile(openCycle, staffProfile)).thenReturn(Optional.empty());
        when(formRepository.save(any())).thenAnswer(inv -> {
            AppraisalForm f = inv.getArgument(0);
            f.setId(50L);
            return f;
        });
        when(sickLeaveRepository.findByAppraisalForm(any())).thenReturn(List.of());

        AppraisalFormResponse result = service.getOrCreateMine(1L, staffUser);

        assertThat(result.id()).isEqualTo(50L);
        assertThat(result.status()).isEqualTo(AppraisalStatus.STAFF_DRAFT);
    }

    @Test
    void getOrCreateMine_closedCycleWithNoExistingForm_throws() {
        AppraisalCycle closedCycle = cycle(1L, 2025, AppraisalCycleStatus.CLOSED);
        when(cycleRepository.findById(1L)).thenReturn(Optional.of(closedCycle));
        when(staffProfileRepository.findByUser(staffUser)).thenReturn(Optional.of(staffProfile));
        when(formRepository.findByCycleAndStaffProfile(closedCycle, staffProfile)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getOrCreateMine(1L, staffUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("closed");
    }

    @Test
    void submitStaffBiodata_notOwner_throws() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(50L, c, staffProfile, AppraisalStatus.STAFF_DRAFT);
        when(formRepository.findById(50L)).thenReturn(Optional.of(f));

        StaffSubmitBiodataRequest req = new StaffSubmitBiodataRequest();
        req.setScheduleOfDuties("Teach and research");

        assertThatThrownBy(() -> service.submitStaffBiodata(50L, req, unitHeadUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void submitStaffBiodata_succeeds_andNotifiesUnitHead() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(50L, c, staffProfile, AppraisalStatus.STAFF_DRAFT);
        when(formRepository.findById(50L)).thenReturn(Optional.of(f));
        when(formRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(sickLeaveRepository.findByAppraisalForm(f)).thenReturn(List.of());

        StaffSubmitBiodataRequest req = new StaffSubmitBiodataRequest();
        req.setScheduleOfDuties("Teach and research");

        AppraisalFormResponse result = service.submitStaffBiodata(50L, req, staffUser);

        assertThat(result.status()).isEqualTo(AppraisalStatus.AWAITING_UNIT_HEAD);
        assertThat(result.scheduleOfDuties()).isEqualTo("Teach and research");
        verify(notificationService).notify(eq(unitHeadUser), anyString(), anyString());
    }

    @Test
    void submitUnitHeadReview_wrongUser_throws() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(50L, c, staffProfile, AppraisalStatus.AWAITING_UNIT_HEAD);
        when(formRepository.findById(50L)).thenReturn(Optional.of(f));

        assertThatThrownBy(() -> service.submitUnitHeadReview(50L, validUnitHeadReviewRequest(), deptHeadUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void submitUnitHeadReview_succeeds_persistsSickLeaveAndNotifiesStaff() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(50L, c, staffProfile, AppraisalStatus.AWAITING_UNIT_HEAD);
        when(formRepository.findById(50L)).thenReturn(Optional.of(f));
        when(formRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(sickLeaveRepository.findByAppraisalForm(f)).thenReturn(List.of());

        UnitHeadReviewRequest req = validUnitHeadReviewRequest();
        SickLeaveEntryRequest sickLeave = new SickLeaveEntryRequest();
        sickLeave.setFromDate(LocalDate.of(2026, 3, 1));
        sickLeave.setToDate(LocalDate.of(2026, 3, 5));
        sickLeave.setNumberOfDays(5);
        req.setSickLeaves(List.of(sickLeave));

        AppraisalFormResponse result = service.submitUnitHeadReview(50L, req, unitHeadUser);

        assertThat(result.status()).isEqualTo(AppraisalStatus.AWAITING_STAFF_COUNTER_COMMENT);
        assertThat(result.overallGrading()).isEqualTo(OverallGrading.VERY_GOOD);
        verify(sickLeaveRepository).save(argThat(s -> s.getNumberOfDays().equals(5)));
        verify(notificationService).notify(eq(staffUser), anyString(), anyString());
    }

    @Test
    void submitStaffCounterComment_notOwner_throws() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(50L, c, staffProfile, AppraisalStatus.AWAITING_STAFF_COUNTER_COMMENT);
        when(formRepository.findById(50L)).thenReturn(Optional.of(f));

        assertThatThrownBy(() -> service.submitStaffCounterComment(50L, new StaffCounterCommentRequest(), unitHeadUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void submitStaffCounterComment_succeeds_notifiesDepartmentHead() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(50L, c, staffProfile, AppraisalStatus.AWAITING_STAFF_COUNTER_COMMENT);
        when(formRepository.findById(50L)).thenReturn(Optional.of(f));
        when(formRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(sickLeaveRepository.findByAppraisalForm(f)).thenReturn(List.of());

        StaffCounterCommentRequest req = new StaffCounterCommentRequest();
        req.setStaffComments("I agree with the assessment");

        AppraisalFormResponse result = service.submitStaffCounterComment(50L, req, staffUser);

        assertThat(result.status()).isEqualTo(AppraisalStatus.AWAITING_DEPARTMENT_HEAD);
        verify(notificationService).notify(eq(deptHeadUser), anyString(), anyString());
    }

    @Test
    void submitDepartmentHeadSignOff_wrongUser_throws() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(50L, c, staffProfile, AppraisalStatus.AWAITING_DEPARTMENT_HEAD);
        when(formRepository.findById(50L)).thenReturn(Optional.of(f));

        assertThatThrownBy(() -> service.submitDepartmentHeadSignOff(50L, new DepartmentHeadSignRequest(), unitHeadUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void submitDepartmentHeadSignOff_succeeds_completesAndNotifiesStaff() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(50L, c, staffProfile, AppraisalStatus.AWAITING_DEPARTMENT_HEAD);
        when(formRepository.findById(50L)).thenReturn(Optional.of(f));
        when(formRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(sickLeaveRepository.findByAppraisalForm(f)).thenReturn(List.of());

        DepartmentHeadSignRequest req = new DepartmentHeadSignRequest();
        req.setDepartmentHeadComments("Approved");

        AppraisalFormResponse result = service.submitDepartmentHeadSignOff(50L, req, deptHeadUser);

        assertThat(result.status()).isEqualTo(AppraisalStatus.COMPLETED);
        verify(notificationService).notify(eq(staffUser), anyString(), anyString());
    }

    @Test
    void resolveDepartmentHead_whenStaffIsDirectlyInDepartment_collapsesToSamePerson() {
        StaffProfile deptProfile = StaffProfile.builder().user(staffUser).staffNumber("STAFF-0002")
                .orgUnit(department).dateOfHire(LocalDate.of(2020, 1, 1)).build();
        deptProfile.setId(101L);
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(51L, c, deptProfile, AppraisalStatus.AWAITING_UNIT_HEAD);
        when(formRepository.findById(51L)).thenReturn(Optional.of(f));
        when(formRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(sickLeaveRepository.findByAppraisalForm(f)).thenReturn(List.of());

        // deptHeadUser heads `department`, which is also this staff's own unit, so the "unit head"
        // step naturally resolves to the department head too -- no special-casing needed.
        AppraisalFormResponse result = service.submitUnitHeadReview(51L, validUnitHeadReviewRequest(), deptHeadUser);

        assertThat(result.status()).isEqualTo(AppraisalStatus.AWAITING_STAFF_COUNTER_COMMENT);
    }

    @Test
    void countCompletedAppraisalsSincePromotion_countsOnlyCyclesAfterBaseline() {
        staffProfile.setLastPromotionDate(LocalDate.of(2023, 6, 1));
        AppraisalForm completed2022 = form(1L, cycle(1L, 2022, AppraisalCycleStatus.CLOSED), staffProfile, AppraisalStatus.COMPLETED);
        AppraisalForm completed2024 = form(2L, cycle(2L, 2024, AppraisalCycleStatus.CLOSED), staffProfile, AppraisalStatus.COMPLETED);
        AppraisalForm completed2025 = form(3L, cycle(3L, 2025, AppraisalCycleStatus.CLOSED), staffProfile, AppraisalStatus.COMPLETED);
        when(formRepository.findByStaffProfileAndStatus(staffProfile, AppraisalStatus.COMPLETED))
                .thenReturn(List.of(completed2022, completed2024, completed2025));

        int count = service.countCompletedAppraisalsSincePromotion(staffProfile);

        assertThat(count).isEqualTo(2);
    }

    @Test
    void countCompletedAppraisalsSincePromotion_fallsBackToDateOfHire_whenNeverPromoted() {
        staffProfile.setLastPromotionDate(null);
        AppraisalForm completed2021 = form(1L, cycle(1L, 2021, AppraisalCycleStatus.CLOSED), staffProfile, AppraisalStatus.COMPLETED);
        when(formRepository.findByStaffProfileAndStatus(staffProfile, AppraisalStatus.COMPLETED))
                .thenReturn(List.of(completed2021));

        int count = service.countCompletedAppraisalsSincePromotion(staffProfile);

        assertThat(count).isEqualTo(1);
    }

    @Test
    void listPendingMyAction_includesFormsWhereUserIsUnitHead() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm awaitingUnitHead = form(60L, c, staffProfile, AppraisalStatus.AWAITING_UNIT_HEAD);
        when(formRepository.findByStatus(AppraisalStatus.AWAITING_UNIT_HEAD)).thenReturn(List.of(awaitingUnitHead));
        when(formRepository.findByStatus(AppraisalStatus.AWAITING_DEPARTMENT_HEAD)).thenReturn(List.of());

        List<AppraisalSummaryResponse> result = service.listPendingMyAction(unitHeadUser);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(60L);
    }

    @Test
    void listPendingMyAction_excludesFormsForOtherUsers() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm awaitingUnitHead = form(60L, c, staffProfile, AppraisalStatus.AWAITING_UNIT_HEAD);
        when(formRepository.findByStatus(AppraisalStatus.AWAITING_UNIT_HEAD)).thenReturn(List.of(awaitingUnitHead));
        when(formRepository.findByStatus(AppraisalStatus.AWAITING_DEPARTMENT_HEAD)).thenReturn(List.of());

        List<AppraisalSummaryResponse> result = service.listPendingMyAction(staffUser);

        assertThat(result).isEmpty();
    }

    @Test
    void getById_ownerCanView() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(50L, c, staffProfile, AppraisalStatus.STAFF_DRAFT);
        when(formRepository.findById(50L)).thenReturn(Optional.of(f));
        when(sickLeaveRepository.findByAppraisalForm(f)).thenReturn(List.of());

        AppraisalFormResponse result = service.getById(50L, staffUser);

        assertThat(result.id()).isEqualTo(50L);
    }

    @Test
    void getById_unrelatedUserWithoutPermission_throws() {
        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(50L, c, staffProfile, AppraisalStatus.STAFF_DRAFT);
        when(formRepository.findById(50L)).thenReturn(Optional.of(f));

        User stranger = user(99L, "stranger");

        assertThatThrownBy(() -> service.getById(50L, stranger))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void submitStaffBiodata_appraiseeIsUnitHeadThemself_escalatesToNextAncestorHead() {
        // unitHeadUser is being appraised, and unitHeadUser also heads `unit` -- reviewing
        // themself would be wrong, so the stage-one reviewer must escalate to the
        // department head instead of resolving to unitHeadUser.
        StaffProfile unitHeadProfile = StaffProfile.builder().user(unitHeadUser).staffNumber("STAFF-0002")
                .orgUnit(unit).dateOfHire(LocalDate.of(2020, 1, 1)).build();
        unitHeadProfile.setId(102L);

        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(52L, c, unitHeadProfile, AppraisalStatus.STAFF_DRAFT);
        when(formRepository.findById(52L)).thenReturn(Optional.of(f));
        when(formRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(sickLeaveRepository.findByAppraisalForm(f)).thenReturn(List.of());

        StaffSubmitBiodataRequest req = new StaffSubmitBiodataRequest();
        req.setScheduleOfDuties("Manage the lab");

        service.submitStaffBiodata(52L, req, unitHeadUser);

        verify(notificationService).notify(eq(deptHeadUser), anyString(), anyString());
        verify(notificationService, never()).notify(eq(unitHeadUser), anyString(), anyString());
    }

    @Test
    void submitStaffBiodata_headOfHrAppraisedByCollegeHead_bothStagesResolveToCollegeHead() {
        User collegeHeadUser = user(4L, "collegehead");
        User hrHeadUser = user(5L, "hrhead");

        OrgUnit college = OrgUnit.builder().name("College").code("COL").type(OrgUnitType.COLLEGE)
                .status(OrgUnitStatus.ACTIVE).head(collegeHeadUser).build();
        college.setId(20L);
        OrgUnit hrDept = OrgUnit.builder().name("HR").code("HR").type(OrgUnitType.DEPARTMENT)
                .status(OrgUnitStatus.ACTIVE).parent(college).head(hrHeadUser).hrUnit(true).build();
        hrDept.setId(21L);

        StaffProfile hrHeadProfile = StaffProfile.builder().user(hrHeadUser).staffNumber("STAFF-0003")
                .orgUnit(hrDept).dateOfHire(LocalDate.of(2020, 1, 1)).build();
        hrHeadProfile.setId(103L);

        AppraisalCycle c = cycle(1L, 2026, AppraisalCycleStatus.OPEN);
        AppraisalForm f = form(53L, c, hrHeadProfile, AppraisalStatus.STAFF_DRAFT);
        when(formRepository.findById(53L)).thenReturn(Optional.of(f));
        when(formRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(sickLeaveRepository.findByAppraisalForm(f)).thenReturn(List.of());

        StaffSubmitBiodataRequest req = new StaffSubmitBiodataRequest();
        req.setScheduleOfDuties("Run HR");

        service.submitStaffBiodata(53L, req, hrHeadUser);

        // Stage one (Head of Unit step) skips hrHeadUser (the appraisee) and escalates to
        // the College head, since HR's own head IS the appraisee here.
        verify(notificationService).notify(eq(collegeHeadUser), anyString(), anyString());
    }

    @Test
    void listForStaff_ownerCanViewTheirOwnHistory() {
        when(staffProfileRepository.findById(100L)).thenReturn(Optional.of(staffProfile));
        when(formRepository.findByStaffProfileOrderByCreatedAtDesc(staffProfile)).thenReturn(List.of());

        List<AppraisalSummaryResponse> result = service.listForStaff(100L, staffUser);

        assertThat(result).isEmpty();
    }

    @Test
    void listForStaff_unrelatedUserWithoutPermission_throws() {
        when(staffProfileRepository.findById(100L)).thenReturn(Optional.of(staffProfile));
        User stranger = user(99L, "stranger");

        assertThatThrownBy(() -> service.listForStaff(100L, stranger))
                .isInstanceOf(AccessDeniedException.class);
    }
}
