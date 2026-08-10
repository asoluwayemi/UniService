package com.uniservice.org.service;

import com.uniservice.auth.entity.Permission;
import com.uniservice.auth.entity.Role;
import com.uniservice.auth.entity.User;
import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitStatus;
import com.uniservice.org.entity.OrgUnitType;
import com.uniservice.org.repository.OrgUnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrgUnitServiceTest {

    @Mock private OrgUnitRepository repository;

    private OrgUnitService service;

    private OrgUnit college;
    private OrgUnit faculty;
    private OrgUnit department;
    private OrgUnit unit;

    @BeforeEach
    void setUp() {
        service = new OrgUnitService(repository);

        college = orgUnit(1L, "College", OrgUnitType.COLLEGE, null);
        faculty = orgUnit(2L, "Faculty", OrgUnitType.FACULTY, college);
        department = orgUnit(3L, "Department", OrgUnitType.DEPARTMENT, faculty);
        unit = orgUnit(4L, "Unit", OrgUnitType.UNIT, department);
    }

    private OrgUnit orgUnit(long id, String name, OrgUnitType type, OrgUnit parent) {
        OrgUnit u = OrgUnit.builder().name(name).code("C" + id).type(type)
                .status(OrgUnitStatus.ACTIVE).parent(parent).build();
        u.setId(id);
        return u;
    }

    @Test
    void descendantOrgUnitIds_returnsWholeSubtreeIncludingRoot() {
        when(repository.findByStatus(OrgUnitStatus.ACTIVE)).thenReturn(List.of(college, faculty, department, unit));

        Set<Long> result = service.descendantOrgUnitIds(faculty);

        assertThat(result).containsExactlyInAnyOrder(2L, 3L, 4L);
    }

    @Test
    void descendantOrgUnitIds_leafUnit_returnsOnlyItself() {
        when(repository.findByStatus(OrgUnitStatus.ACTIVE)).thenReturn(List.of(college, faculty, department, unit));

        Set<Long> result = service.descendantOrgUnitIds(unit);

        assertThat(result).containsExactly(4L);
    }

    @Test
    void isWithinSubtree_trueForDescendant_falseForUnrelated() {
        when(repository.findByStatus(OrgUnitStatus.ACTIVE)).thenReturn(List.of(college, faculty, department, unit));

        assertThat(service.isWithinSubtree(unit, faculty)).isTrue();
        assertThat(service.isWithinSubtree(faculty, department)).isFalse();
    }

    @Test
    void descendantOrgUnitIdsForHeadedUnits_unionsAcrossMultipleHeadedUnits() {
        User head = new User();
        head.setId(9L);
        OrgUnit otherFaculty = orgUnit(5L, "Other Faculty", OrgUnitType.FACULTY, college);
        when(repository.findByHeadAndStatus(head, OrgUnitStatus.ACTIVE)).thenReturn(List.of(department, otherFaculty));
        when(repository.findByStatus(OrgUnitStatus.ACTIVE))
                .thenReturn(List.of(college, faculty, department, unit, otherFaculty));

        Set<Long> result = service.descendantOrgUnitIdsForHeadedUnits(head);

        assertThat(result).containsExactlyInAnyOrder(3L, 4L, 5L);
    }

    @Test
    void ancestorChain_walksFromParentToRoot_excludingSelf() {
        List<OrgUnit> chain = service.ancestorChain(unit);

        assertThat(chain).containsExactly(department, faculty, college);
    }

    @Test
    void reassignHrUnit_clearsOldFlagBeforeSettingNew() {
        OrgUnit oldHrUnit = orgUnit(6L, "Old HR", OrgUnitType.DEPARTMENT, faculty);
        oldHrUnit.setHrUnit(true);
        OrgUnit newHrUnit = orgUnit(7L, "New HR", OrgUnitType.DEPARTMENT, faculty);

        when(repository.findByHrUnitTrueAndStatus(OrgUnitStatus.ACTIVE)).thenReturn(Optional.of(oldHrUnit));

        service.reassignHrUnit(newHrUnit);

        assertThat(oldHrUnit.isHrUnit()).isFalse();
        assertThat(newHrUnit.isHrUnit()).isTrue();

        InOrder inOrder = inOrder(repository);
        inOrder.verify(repository).saveAndFlush(oldHrUnit);
        inOrder.verify(repository).save(newHrUnit);
    }

    @Test
    void reassignHrUnit_noExistingHrUnit_justSetsNewFlag() {
        OrgUnit newHrUnit = orgUnit(7L, "New HR", OrgUnitType.DEPARTMENT, faculty);
        when(repository.findByHrUnitTrueAndStatus(OrgUnitStatus.ACTIVE)).thenReturn(Optional.empty());

        service.reassignHrUnit(newHrUnit);

        assertThat(newHrUnit.isHrUnit()).isTrue();
        verify(repository, never()).saveAndFlush(any());
        verify(repository).save(newHrUnit);
    }

    @Test
    void listVisible_blanketOrgRead_returnsEverything() {
        User caller = new User();
        caller.setId(1L);
        Permission orgRead = Permission.builder().name("ORG_READ").build();
        Role role = Role.builder().name("SYSTEM_ADMIN").permissions(Set.of(orgRead)).build();
        caller.setRoles(new HashSet<>(Set.of(role)));
        when(repository.findAll()).thenReturn(List.of(college, faculty, department, unit));

        List<OrgUnit> result = service.listVisible(caller);

        assertThat(result).hasSize(4);
    }

    @Test
    void listVisible_subtreeScoped_includesHeadedSubtreeAndAncestorChain() {
        User caller = new User();
        caller.setId(9L);
        caller.setRoles(new HashSet<>());

        when(repository.findByHeadAndStatus(caller, OrgUnitStatus.ACTIVE)).thenReturn(List.of(department));
        when(repository.findByStatus(OrgUnitStatus.ACTIVE)).thenReturn(List.of(college, faculty, department, unit));
        when(repository.findAll()).thenReturn(List.of(college, faculty, department, unit));

        List<OrgUnit> result = service.listVisible(caller);

        // department + unit (its subtree) plus faculty + college (the ancestor chain above it)
        assertThat(result).containsExactlyInAnyOrder(college, faculty, department, unit);
    }
}
