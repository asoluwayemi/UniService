package com.uniservice.staff.service;

import com.uniservice.appraisal.service.AppraisalService;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitStatus;
import com.uniservice.org.entity.OrgUnitType;
import com.uniservice.org.repository.OrgUnitRepository;
import com.uniservice.org.service.OrgUnitService;
import com.uniservice.org.service.RoleSyncService;
import com.uniservice.staff.dto.*;
import com.uniservice.staff.entity.*;
import com.uniservice.staff.repository.AcademicQualificationRepository;
import com.uniservice.staff.repository.EmploymentHistoryRepository;
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
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffProfileServiceTest {

    @Mock private StaffProfileRepository staffProfileRepository;
    @Mock private AcademicQualificationRepository qualificationRepository;
    @Mock private EmploymentHistoryRepository employmentHistoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private OrgUnitRepository orgUnitRepository;
    @Mock private AppraisalService appraisalService;
    @Mock private OrgUnitService orgUnitService;
    @Mock private RoleSyncService roleSyncService;

    private StaffProfileService service;

    private User user;

    @BeforeEach
    void setUp() {
        service = new StaffProfileService(staffProfileRepository, qualificationRepository,
                employmentHistoryRepository, userRepository, orgUnitRepository, appraisalService,
                orgUnitService, roleSyncService);

        user = new User();
        user.setId(1L);
        user.setUsername("jdoe");
        user.setFirstName("Jane");
        user.setLastName("Doe");
        user.setEmail("jdoe@uniservice.local");
    }

    private CreateStaffProfileRequest createRequest() {
        CreateStaffProfileRequest r = new CreateStaffProfileRequest();
        r.setUserId(1L);
        r.setStaffNumber("STAFF-0001");
        r.setCategory(StaffCategory.ACADEMIC);
        r.setEmploymentType(EmploymentType.FULL_TIME);
        r.setDateOfHire(LocalDate.now().minusYears(4));
        return r;
    }

    @Test
    void create_succeeds_forNewUserAndUniqueStaffNumber() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(staffProfileRepository.existsByUser(user)).thenReturn(false);
        when(staffProfileRepository.findByStaffNumber("STAFF-0001")).thenReturn(Optional.empty());
        when(staffProfileRepository.save(any(StaffProfile.class))).thenAnswer(inv -> {
            StaffProfile p = inv.getArgument(0);
            p.setId(10L);
            return p;
        });
        when(qualificationRepository.findByStaffProfile(any())).thenReturn(List.of());
        when(employmentHistoryRepository.findByStaffProfile(any())).thenReturn(List.of());
        when(appraisalService.countCompletedAppraisalsSincePromotion(any())).thenReturn(3);

        StaffProfileResponse result = service.create(createRequest());

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.staffNumber()).isEqualTo("STAFF-0001");
        assertThat(result.userId()).isEqualTo(1L);
        assertThat(result.category()).isEqualTo(StaffCategory.ACADEMIC);
        assertThat(result.completedAppraisalsSincePromotion()).isEqualTo(3);
        assertThat(result.eligibleForPromotion()).isTrue();
    }

    @Test
    void create_userAlreadyHasProfile_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(staffProfileRepository.existsByUser(user)).thenReturn(true);

        assertThatThrownBy(() -> service.create(createRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already has a staff profile");
    }

    @Test
    void create_duplicateStaffNumber_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(staffProfileRepository.existsByUser(user)).thenReturn(false);

        StaffProfile existing = StaffProfile.builder().staffNumber("STAFF-0001").build();
        existing.setId(99L);
        when(staffProfileRepository.findByStaffNumber("STAFF-0001")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.create(createRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already in use");
    }

    @Test
    void create_withArchivedOrgUnit_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(staffProfileRepository.existsByUser(user)).thenReturn(false);
        when(staffProfileRepository.findByStaffNumber("STAFF-0001")).thenReturn(Optional.empty());

        OrgUnit archived = OrgUnit.builder().name("Old Dept").code("OLD").type(OrgUnitType.DEPARTMENT).status(OrgUnitStatus.ARCHIVED).build();
        archived.setId(5L);
        when(orgUnitRepository.findById(5L)).thenReturn(Optional.of(archived));

        CreateStaffProfileRequest request = createRequest();
        request.setOrgUnitId(5L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("archived");
    }

    @Test
    void getMine_noProfile_autoCreatesProfileWithDefaults() {
        when(staffProfileRepository.findByUser(user)).thenReturn(Optional.empty());
        when(staffProfileRepository.save(any(StaffProfile.class))).thenAnswer(inv -> {
            StaffProfile p = inv.getArgument(0);
            p.setId(20L);
            return p;
        });
        when(qualificationRepository.findByStaffProfile(any())).thenReturn(List.of());
        when(employmentHistoryRepository.findByStaffProfile(any())).thenReturn(List.of());
        when(appraisalService.countCompletedAppraisalsSincePromotion(any())).thenReturn(0);

        StaffProfileResponse result = service.getMine(user);

        assertThat(result.id()).isEqualTo(20L);
        assertThat(result.userId()).isEqualTo(user.getId());
        assertThat(result.staffNumber()).isEqualTo("STAFF-0001");
    }

    @Test
    void removeQualification_belongingToDifferentProfile_throws() {
        StaffProfile profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").build();
        profile.setId(1L);
        StaffProfile otherProfile = StaffProfile.builder().user(user).staffNumber("STAFF-0002").build();
        otherProfile.setId(2L);

        AcademicQualification qualification = AcademicQualification.builder().staffProfile(otherProfile).degree("BSc").institution("X").build();
        qualification.setId(7L);

        when(staffProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(qualificationRepository.findById(7L)).thenReturn(Optional.of(qualification));

        assertThatThrownBy(() -> service.removeQualification(1L, 7L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong");
    }

    @Test
    void addQualification_succeeds() {
        StaffProfile profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").build();
        profile.setId(1L);
        when(staffProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(qualificationRepository.findByStaffProfile(profile)).thenReturn(List.of());
        when(employmentHistoryRepository.findByStaffProfile(profile)).thenReturn(List.of());
        when(appraisalService.countCompletedAppraisalsSincePromotion(any())).thenReturn(0);

        AddQualificationRequest request = new AddQualificationRequest();
        request.setDegree("PhD");
        request.setInstitution("MIT");

        StaffProfileResponse result = service.addQualification(1L, request);

        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void listAll_blanketStaffRead_returnsEveryProfile() {
        User caller = new User();
        caller.setId(9L);
        caller.setUsername("hr");
        com.uniservice.auth.entity.Permission staffRead =
                com.uniservice.auth.entity.Permission.builder().name("STAFF_READ").build();
        com.uniservice.auth.entity.Role hrAdmin = com.uniservice.auth.entity.Role.builder()
                .name("HR_ADMIN").permissions(Set.of(staffRead)).build();
        caller.setRoles(Set.of(hrAdmin));

        StaffProfile other = StaffProfile.builder().user(user).staffNumber("STAFF-0002").build();
        other.setId(2L);
        when(staffProfileRepository.findAll()).thenReturn(List.of(other));

        List<StaffProfileSummaryResponse> result = service.listAll(caller);

        assertThat(result).hasSize(1);
    }

    @Test
    void listAll_subtreeScoped_filtersToOwnAndSubtreeProfiles() {
        User caller = new User();
        caller.setId(9L);
        caller.setUsername("depthead");

        OrgUnit inSubtree = OrgUnit.builder().name("CS").code("CS").type(OrgUnitType.DEPARTMENT)
                .status(OrgUnitStatus.ACTIVE).build();
        inSubtree.setId(5L);
        OrgUnit outsideSubtree = OrgUnit.builder().name("Physics").code("PHY").type(OrgUnitType.DEPARTMENT)
                .status(OrgUnitStatus.ACTIVE).build();
        outsideSubtree.setId(6L);

        StaffProfile inScope = StaffProfile.builder().user(user).staffNumber("STAFF-0003").orgUnit(inSubtree).build();
        inScope.setId(3L);
        StaffProfile outOfScope = StaffProfile.builder().user(user).staffNumber("STAFF-0004").orgUnit(outsideSubtree).build();
        outOfScope.setId(4L);

        when(staffProfileRepository.findAll()).thenReturn(List.of(inScope, outOfScope));
        when(orgUnitService.descendantOrgUnitIdsForHeadedUnits(caller)).thenReturn(Set.of(5L));

        List<StaffProfileSummaryResponse> result = service.listAll(caller);

        assertThat(result).extracting(StaffProfileSummaryResponse::id).containsExactly(3L);
    }

    @Test
    void getById_ownProfile_isAlwaysVisible() {
        StaffProfile profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").build();
        profile.setId(1L);
        when(staffProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(qualificationRepository.findByStaffProfile(profile)).thenReturn(List.of());
        when(employmentHistoryRepository.findByStaffProfile(profile)).thenReturn(List.of());
        when(appraisalService.countCompletedAppraisalsSincePromotion(profile)).thenReturn(0);

        StaffProfileResponse result = service.getById(1L, user);

        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void getById_unrelatedCallerOutsideSubtree_throws() {
        StaffProfile profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").build();
        profile.setId(1L);
        when(staffProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        when(orgUnitService.descendantOrgUnitIdsForHeadedUnits(any())).thenReturn(Set.of());

        User stranger = new User();
        stranger.setId(77L);
        stranger.setUsername("stranger");

        assertThatThrownBy(() -> service.getById(1L, stranger)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateMyContactInfo_updatesOnlyContactFieldsOnCallersOwnProfile() {
        StaffProfile profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001")
                .designation("Lecturer").build();
        profile.setId(1L);
        when(staffProfileRepository.findByUser(user)).thenReturn(Optional.of(profile));
        when(staffProfileRepository.save(any(StaffProfile.class))).thenAnswer(inv -> inv.getArgument(0));
        when(qualificationRepository.findByStaffProfile(profile)).thenReturn(List.of());
        when(employmentHistoryRepository.findByStaffProfile(profile)).thenReturn(List.of());
        when(appraisalService.countCompletedAppraisalsSincePromotion(any())).thenReturn(0);

        UpdateContactInfoRequest request = new UpdateContactInfoRequest();
        request.setPhone("08000000000");
        request.setAddress("1 University Road");
        request.setNationality("Nigerian");
        request.setEmergencyContactName("John Doe");
        request.setEmergencyContactRelationship("Spouse");
        request.setEmergencyContactPhone("08011111111");

        StaffProfileResponse result = service.updateMyContactInfo(user, request);

        assertThat(result.phone()).isEqualTo("08000000000");
        assertThat(result.emergencyContactName()).isEqualTo("John Doe");
        assertThat(result.emergencyContactPhone()).isEqualTo("08011111111");
        // Employment fields set on the profile before the update must be untouched.
        assertThat(result.designation()).isEqualTo("Lecturer");
    }

    @Test
    void addMyQualification_attachesToCallersOwnProfile_notAnArbitraryId() {
        StaffProfile profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").build();
        profile.setId(1L);
        when(staffProfileRepository.findByUser(user)).thenReturn(Optional.of(profile));
        when(qualificationRepository.findByStaffProfile(profile)).thenReturn(List.of());
        when(employmentHistoryRepository.findByStaffProfile(profile)).thenReturn(List.of());
        when(appraisalService.countCompletedAppraisalsSincePromotion(any())).thenReturn(0);

        AddQualificationRequest request = new AddQualificationRequest();
        request.setDegree("MSc");
        request.setInstitution("University of Lagos");
        request.setDocumentUrl("/api/uploads/abc123");

        StaffProfileResponse result = service.addMyQualification(user, request);

        assertThat(result.id()).isEqualTo(1L);
        org.mockito.Mockito.verify(staffProfileRepository, org.mockito.Mockito.never()).findById(any());
    }

    @Test
    void removeMyQualification_belongingToSomeoneElse_throws() {
        StaffProfile myProfile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").build();
        myProfile.setId(1L);
        User otherUser = new User();
        otherUser.setId(2L);
        StaffProfile otherProfile = StaffProfile.builder().user(otherUser).staffNumber("STAFF-0002").build();
        otherProfile.setId(2L);

        AcademicQualification othersQualification = AcademicQualification.builder()
                .staffProfile(otherProfile).degree("BSc").institution("X").build();
        othersQualification.setId(7L);

        when(staffProfileRepository.findByUser(user)).thenReturn(Optional.of(myProfile));
        when(qualificationRepository.findById(7L)).thenReturn(Optional.of(othersQualification));

        assertThatThrownBy(() -> service.removeMyQualification(user, 7L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong");
    }
}
