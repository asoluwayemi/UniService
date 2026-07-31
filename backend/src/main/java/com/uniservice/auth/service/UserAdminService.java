package com.uniservice.auth.service;

import com.uniservice.auth.dto.CreateUserRequest;
import com.uniservice.auth.dto.UserSummaryResponse;
import com.uniservice.auth.entity.Role;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.RoleRepository;
import com.uniservice.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    /** Roles a non-SYSTEM_ADMIN actor (e.g. a Head of HR using HR_USER_MANAGE) may assign. */
    private static final Set<String> HR_ASSIGNABLE_ROLES = Set.of("HR_STAFF");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserSummaryResponse createUser(CreateUserRequest request, User actor) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email '" + request.getEmail() + "' is already in use");
        }

        Set<Role> resolvedRoles = resolveRoles(request.getRoleNames());
        assertActorMayAssign(resolvedRoles, actor);

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .enabled(true)
                .roles(resolvedRoles)
                .build();
        User saved = userRepository.save(user);

        return new UserSummaryResponse(saved.getId(), saved.getUsername(), saved.getEmail(),
                saved.getFirstName(), saved.getLastName(), saved.isEnabled(),
                saved.getRoles().stream().map(Role::getName).collect(Collectors.toCollection(TreeSet::new)));
    }

    /**
     * Server-side allow-list, independent of what the client sends: only SYSTEM_ADMIN may
     * assign arbitrary roles. Anyone else (e.g. a Head of HR relying on HR_USER_MANAGE) is
     * restricted to HR_ASSIGNABLE_ROLES, so an HR head can never mint themself or anyone
     * else a SYSTEM_ADMIN/COLLEGE_ADMIN account.
     */
    private void assertActorMayAssign(Set<Role> resolvedRoles, User actor) {
        boolean actorIsSystemAdmin = actor.getRoles().stream().anyMatch(r -> r.getName().equals("SYSTEM_ADMIN"));
        if (actorIsSystemAdmin) {
            return;
        }
        Set<String> disallowed = resolvedRoles.stream()
                .map(Role::getName)
                .filter(name -> !HR_ASSIGNABLE_ROLES.contains(name))
                .collect(Collectors.toSet());
        if (!disallowed.isEmpty()) {
            throw new AccessDeniedException("Cannot assign roles: " + disallowed);
        }
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        Set<Role> roles = new HashSet<>();
        for (String name : roleNames) {
            roles.add(roleRepository.findByName(name)
                    .orElseThrow(() -> new IllegalArgumentException("Unknown role: " + name)));
        }
        return roles;
    }
}
