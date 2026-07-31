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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Keeps a user's headship-derived roles (COLLEGE_ADMIN, FACULTY_ROLE, DEPARTMENT_ROLE,
 * UNIT_ROLE, HR_ADMIN) and HR-placement-derived role (HR_STAFF) in sync with the live org
 * chart. Every method does a full recompute from current DB state for the affected user(s)
 * rather than incrementing/decrementing — this is what makes it correct when a person heads
 * more than one unit (e.g. two Units, or a Department and separately the HR unit).
 */
@Service
@RequiredArgsConstructor
public class RoleSyncService {

    private static final Map<OrgUnitType, String> TYPE_ROLE = Map.of(
            OrgUnitType.COLLEGE, "COLLEGE_ADMIN",
            OrgUnitType.FACULTY, "FACULTY_ROLE",
            OrgUnitType.DEPARTMENT, "DEPARTMENT_ROLE",
            OrgUnitType.UNIT, "UNIT_ROLE");

    private static final String HR_ADMIN_ROLE = "HR_ADMIN";
    private static final String HR_STAFF_ROLE = "HR_STAFF";

    private static final Set<String> HEADSHIP_MANAGED_ROLES =
            Set.of("COLLEGE_ADMIN", "FACULTY_ROLE", "DEPARTMENT_ROLE", "UNIT_ROLE", HR_ADMIN_ROLE);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final OrgUnitService orgUnitService;

    @Transactional
    public void onHeadChanged(User previousHead, User newHead, OrgUnit unit) {
        if (previousHead != null) {
            reconcileHeadshipRoles(previousHead);
        }
        if (newHead != null) {
            reconcileHeadshipRoles(newHead);
        }
    }

    @Transactional
    public void onOrgUnitArchived(OrgUnit unit) {
        if (unit.getHead() != null) {
            reconcileHeadshipRoles(unit.getHead());
        }
    }

    /** Full recompute of one user's headship-derived roles from their current active headships. */
    @Transactional
    public void reconcileHeadshipRoles(User user) {
        List<OrgUnit> headed = orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE);

        Set<String> desired = new HashSet<>();
        for (OrgUnit unit : headed) {
            String typeRole = TYPE_ROLE.get(unit.getType());
            if (typeRole != null) {
                desired.add(typeRole);
            }
            if (unit.isHrUnit()) {
                desired.add(HR_ADMIN_ROLE);
            }
        }

        Set<String> currentManaged = user.getRoles().stream()
                .map(Role::getName)
                .filter(HEADSHIP_MANAGED_ROLES::contains)
                .collect(Collectors.toSet());

        if (currentManaged.equals(desired)) {
            return;
        }

        Set<Role> newRoles = user.getRoles().stream()
                .filter(role -> !HEADSHIP_MANAGED_ROLES.contains(role.getName()))
                .collect(Collectors.toCollection(HashSet::new));
        for (String roleName : desired) {
            roleRepository.findByName(roleName).ifPresent(newRoles::add);
        }

        user.setRoles(newRoles);
        userRepository.save(user);
    }

    /** Reconciles every user who currently heads at least one active org unit. */
    @Transactional
    public void resyncAllHeadshipRoles() {
        Set<Long> headUserIds = new HashSet<>();
        for (OrgUnit unit : orgUnitRepository.findByStatus(OrgUnitStatus.ACTIVE)) {
            if (unit.getHead() != null) {
                headUserIds.add(unit.getHead().getId());
            }
        }
        headUserIds.forEach(id -> userRepository.findById(id).ifPresent(this::reconcileHeadshipRoles));
    }

    /**
     * HR_STAFF is placement-derived, not headship-derived: granted iff the staff member's org
     * unit sits within the HR-designated unit's subtree and they don't themself head any unit
     * (heads get HR_ADMIN via reconcileHeadshipRoles instead, not layered with HR_STAFF too).
     */
    @Transactional
    public void syncHrStaffRole(StaffProfile profile) {
        User user = profile.getUser();
        if (user == null) {
            return;
        }
        boolean headsAnyUnit = !orgUnitRepository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE).isEmpty();
        boolean shouldHaveHrStaff = !headsAnyUnit && isWithinHrSubtree(profile.getOrgUnit());

        boolean currentlyHas = user.getRoles().stream().anyMatch(role -> role.getName().equals(HR_STAFF_ROLE));
        if (currentlyHas == shouldHaveHrStaff) {
            return;
        }

        Set<Role> newRoles = new HashSet<>(user.getRoles());
        if (shouldHaveHrStaff) {
            roleRepository.findByName(HR_STAFF_ROLE).ifPresent(newRoles::add);
        } else {
            newRoles.removeIf(role -> role.getName().equals(HR_STAFF_ROLE));
        }
        user.setRoles(newRoles);
        userRepository.save(user);
    }

    @Transactional
    public void resyncAllHrStaffRoles() {
        staffProfileRepository.findAll().forEach(this::syncHrStaffRole);
    }

    private boolean isWithinHrSubtree(OrgUnit staffOrgUnit) {
        if (staffOrgUnit == null) {
            return false;
        }
        return orgUnitService.findActiveHrUnit()
                .map(hrUnit -> orgUnitService.isWithinSubtree(staffOrgUnit, hrUnit))
                .orElse(false);
    }
}
