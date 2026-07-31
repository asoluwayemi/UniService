package com.uniservice.org.service;

import com.uniservice.auth.entity.Role;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.RoleRepository;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitStatus;
import com.uniservice.org.entity.OrgUnitType;
import com.uniservice.org.repository.OrgUnitRepository;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.StaffProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleSyncServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private OrgUnitRepository orgUnitRepository;
    @Mock private StaffProfileRepository staffProfileRepository;
    @Mock private OrgUnitService orgUnitService;

    private RoleSyncService service;

    private User user;
    private Role departmentRole;
    private Role unitRole;
    private Role hrAdminRole;
    private Role systemAdminRole;
    private Role hrStaffRole;

    @BeforeEach
    void setUp() {
        service = new RoleSyncService(userRepository, roleRepository, orgUnitRepository, staffProfileRepository, orgUnitService);

        user = new User();
        user.setId(1L);
        user.setUsername("jdoe");
        user.setRoles(new HashSet<>());

        departmentRole = Role.builder().name("DEPARTMENT_ROLE").build();
        departmentRole.setId(10L);
        unitRole = Role.builder().name("UNIT_ROLE").build();
        unitRole.setId(11L);
        hrAdminRole = Role.builder().name("HR_ADMIN").build();
        hrAdminRole.setId(12L);
        systemAdminRole = Role.builder().name("SYSTEM_ADMIN").build();
        systemAdminRole.setId(13L);
        hrStaffRole = Role.builder().name("HR_STAFF").build();
        hrStaffRole.setId(14L);
    }

    private OrgUnit orgUnit(long id, OrgUnitType type, User head, boolean isHrUnit) {
        OrgUnit unit = OrgUnit.builder().name("Unit " + id).code("U" + id).type(type)
                .status(OrgUnitStatus.ACTIVE).head(head).hrUnit(isHrUnit).build();
        unit.setId(id);
        return unit;
    }

    @Test
    void reconcileHeadshipRoles_grantsRoleForHeadedUnit() {
        OrgUnit department = orgUnit(1L, OrgUnitType.DEPARTMENT, user, false);
        when(orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE)).thenReturn(List.of(department));
        when(roleRepository.findByName("DEPARTMENT_ROLE")).thenReturn(Optional.of(departmentRole));

        service.reconcileHeadshipRoles(user);

        verify(userRepository).save(argThat(u -> u.getRoles().contains(departmentRole)));
    }

    @Test
    void reconcileHeadshipRoles_headingTwoUnitsOfSameType_isIdempotent_noDuplicateRole() {
        OrgUnit unitA = orgUnit(1L, OrgUnitType.UNIT, user, false);
        OrgUnit unitB = orgUnit(2L, OrgUnitType.UNIT, user, false);
        when(orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE)).thenReturn(List.of(unitA, unitB));
        when(roleRepository.findByName("UNIT_ROLE")).thenReturn(Optional.of(unitRole));

        service.reconcileHeadshipRoles(user);

        verify(userRepository).save(argThat(u -> u.getRoles().size() == 1 && u.getRoles().contains(unitRole)));
    }

    @Test
    void reconcileHeadshipRoles_headsDepartmentAndSeparatelyHrUnit_getsBothRoles() {
        OrgUnit department = orgUnit(1L, OrgUnitType.DEPARTMENT, user, false);
        OrgUnit hrUnit = orgUnit(2L, OrgUnitType.UNIT, user, true);
        when(orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE)).thenReturn(List.of(department, hrUnit));
        when(roleRepository.findByName("DEPARTMENT_ROLE")).thenReturn(Optional.of(departmentRole));
        when(roleRepository.findByName("UNIT_ROLE")).thenReturn(Optional.of(unitRole));
        when(roleRepository.findByName("HR_ADMIN")).thenReturn(Optional.of(hrAdminRole));

        service.reconcileHeadshipRoles(user);

        verify(userRepository).save(argThat(u ->
                u.getRoles().contains(departmentRole) && u.getRoles().contains(unitRole) && u.getRoles().contains(hrAdminRole)));
    }

    @Test
    void reconcileHeadshipRoles_noLongerHeadingAnything_revokesPreviousHeadshipRole() {
        user.setRoles(new HashSet<>(Set.of(departmentRole)));
        when(orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE)).thenReturn(List.of());

        service.reconcileHeadshipRoles(user);

        verify(userRepository).save(argThat(u -> u.getRoles().isEmpty()));
    }

    @Test
    void reconcileHeadshipRoles_doesNotTouchNonHeadshipManagedRoles() {
        user.setRoles(new HashSet<>(Set.of(systemAdminRole)));
        when(orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE)).thenReturn(List.of());

        service.reconcileHeadshipRoles(user);

        // Nothing headship-related changed, so no save happens at all (see the
        // no-op-skip-save test below) -- SYSTEM_ADMIN simply stays untouched in-memory.
        assertThat(user.getRoles()).containsExactly(systemAdminRole);
    }

    @Test
    void reconcileHeadshipRoles_noChangeNeeded_skipsSave() {
        user.setRoles(new HashSet<>(Set.of(departmentRole)));
        OrgUnit department = orgUnit(1L, OrgUnitType.DEPARTMENT, user, false);
        when(orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE)).thenReturn(List.of(department));

        service.reconcileHeadshipRoles(user);

        verify(userRepository, never()).save(any());
    }

    @Test
    void syncHrStaffRole_grantsWhenPlacedInHrSubtreeAndNotAHead() {
        OrgUnit hrUnit = orgUnit(5L, OrgUnitType.DEPARTMENT, null, true);
        OrgUnit staffUnit = orgUnit(6L, OrgUnitType.UNIT, null, false);
        StaffProfile profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").orgUnit(staffUnit).build();

        when(orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE)).thenReturn(List.of());
        when(orgUnitService.findActiveHrUnit()).thenReturn(Optional.of(hrUnit));
        when(orgUnitService.isWithinSubtree(staffUnit, hrUnit)).thenReturn(true);
        when(roleRepository.findByName("HR_STAFF")).thenReturn(Optional.of(hrStaffRole));

        service.syncHrStaffRole(profile);

        verify(userRepository).save(argThat(u -> u.getRoles().contains(hrStaffRole)));
    }

    @Test
    void syncHrStaffRole_doesNotGrantWhenUserIsAHead() {
        OrgUnit hrUnit = orgUnit(5L, OrgUnitType.DEPARTMENT, null, true);
        OrgUnit staffUnit = orgUnit(6L, OrgUnitType.UNIT, null, false);
        OrgUnit headedUnit = orgUnit(7L, OrgUnitType.UNIT, user, false);
        StaffProfile profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").orgUnit(staffUnit).build();

        when(orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE)).thenReturn(List.of(headedUnit));

        service.syncHrStaffRole(profile);

        verify(userRepository, never()).save(any());
    }

    @Test
    void syncHrStaffRole_revokesWhenMovedOutOfHrSubtree() {
        user.setRoles(new HashSet<>(Set.of(hrStaffRole)));
        OrgUnit hrUnit = orgUnit(5L, OrgUnitType.DEPARTMENT, null, true);
        OrgUnit staffUnit = orgUnit(6L, OrgUnitType.UNIT, null, false);
        StaffProfile profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").orgUnit(staffUnit).build();

        when(orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE)).thenReturn(List.of());
        when(orgUnitService.findActiveHrUnit()).thenReturn(Optional.of(hrUnit));
        when(orgUnitService.isWithinSubtree(staffUnit, hrUnit)).thenReturn(false);

        service.syncHrStaffRole(profile);

        verify(userRepository).save(argThat(u -> !u.getRoles().contains(hrStaffRole)));
    }
}
