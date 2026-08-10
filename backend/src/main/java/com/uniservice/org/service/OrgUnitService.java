package com.uniservice.org.service;

import com.uniservice.auth.entity.User;
import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitStatus;
import com.uniservice.org.repository.OrgUnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrgUnitService {

    private final OrgUnitRepository repository;

    public List<OrgUnit> listAll() {
        return repository.findAll();
    }

    public OrgUnit getById(Long id) {
        return repository.findById(id).orElseThrow();
    }

    private boolean hasAuthority(User user, String permissionName) {
        return user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .anyMatch(p -> p.getName().equals(permissionName));
    }

    /**
     * Blanket ORG_READ holders see everything. Subtree-scoped viewers (Faculty/Department
     * heads) see their own headed subtree(s) plus the ancestor chain above their own unit,
     * so the org-tree UI has a root to render from instead of an orphaned branch.
     */
    public List<OrgUnit> listVisible(User caller) {
        if (hasAuthority(caller, "ORG_READ")) {
            return listAll();
        }
        Set<Long> visibleIds = new HashSet<>(descendantOrgUnitIdsForHeadedUnits(caller));
        for (OrgUnit headed : repository.findByHeadAndStatus(caller, OrgUnitStatus.ACTIVE)) {
            ancestorChain(headed).forEach(ancestor -> visibleIds.add(ancestor.getId()));
        }
        return listAll().stream().filter(unit -> visibleIds.contains(unit.getId())).toList();
    }

    public OrgUnit getVisibleById(Long id, User caller) {
        OrgUnit unit = getById(id);
        if (hasAuthority(caller, "ORG_READ")) {
            return unit;
        }
        boolean visible = descendantOrgUnitIdsForHeadedUnits(caller).contains(unit.getId())
                || repository.findByHeadAndStatus(caller, OrgUnitStatus.ACTIVE).stream()
                        .anyMatch(headed -> ancestorChain(headed).stream().anyMatch(a -> a.getId().equals(unit.getId())));
        if (!visible) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have access to this org unit");
        }
        return unit;
    }

    /**
     * All active org units reachable from (and including) {@code root} by walking
     * down parent -> children. In-memory BFS over the active org chart, which is
     * small (hundreds of rows, not millions) — avoids a recursive-CTE query the
     * codebase doesn't otherwise use.
     */
    public Set<Long> descendantOrgUnitIds(OrgUnit root) {
        List<OrgUnit> active = repository.findByStatus(OrgUnitStatus.ACTIVE);
        Map<Long, List<OrgUnit>> childrenByParentId = active.stream()
                .filter(unit -> unit.getParent() != null)
                .collect(Collectors.groupingBy(unit -> unit.getParent().getId()));

        Set<Long> result = new HashSet<>();
        Deque<Long> queue = new ArrayDeque<>();
        result.add(root.getId());
        queue.add(root.getId());
        while (!queue.isEmpty()) {
            Long current = queue.poll();
            for (OrgUnit child : childrenByParentId.getOrDefault(current, List.of())) {
                if (result.add(child.getId())) {
                    queue.add(child.getId());
                }
            }
        }
        return result;
    }

    public boolean isWithinSubtree(OrgUnit candidate, OrgUnit root) {
        if (candidate == null || root == null) {
            return false;
        }
        return descendantOrgUnitIds(root).contains(candidate.getId());
    }

    /** Union of descendantOrgUnitIds across every active org unit this user currently heads. */
    public Set<Long> descendantOrgUnitIdsForHeadedUnits(User user) {
        List<OrgUnit> headed = repository.findByHeadAndStatus(user, OrgUnitStatus.ACTIVE);
        Set<Long> result = new HashSet<>();
        for (OrgUnit unit : headed) {
            result.addAll(descendantOrgUnitIds(unit));
        }
        return result;
    }

    /** The ancestor chain from the org root down to (excluding) {@code unit} itself. */
    public List<OrgUnit> ancestorChain(OrgUnit unit) {
        List<OrgUnit> chain = new java.util.ArrayList<>();
        OrgUnit current = unit.getParent();
        while (current != null) {
            chain.add(current);
            current = current.getParent();
        }
        return chain;
    }

    public Optional<OrgUnit> findActiveHrUnit() {
        return repository.findByHrUnitTrueAndStatus(OrgUnitStatus.ACTIVE);
    }

    /** Clears any previously-designated HR unit before setting the new one, so the
     *  partial unique index on (is_hr_unit) WHERE is_hr_unit never sees two active rows. */
    @Transactional
    public void reassignHrUnit(OrgUnit newHrUnit) {
        findActiveHrUnit()
                .filter(old -> !old.getId().equals(newHrUnit.getId()))
                .ifPresent(old -> {
                    old.setHrUnit(false);
                    repository.saveAndFlush(old);
                });
        newHrUnit.setHrUnit(true);
        repository.save(newHrUnit);
    }

    @Transactional
    public void clearHrUnit(OrgUnit unit) {
        unit.setHrUnit(false);
        repository.save(unit);
    }
}
