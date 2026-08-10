package com.uniservice.auth.service;

import com.uniservice.auth.dto.MeResponse;
import com.uniservice.auth.dto.UserSummaryResponse;
import com.uniservice.auth.entity.Permission;
import com.uniservice.auth.entity.Role;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.auth.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserQueryService {

    private final UserRepository userRepository;

    public MeResponse getCurrentUser(UserPrincipal principal) {
        User user = principal.getUser();

        var roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toCollection(TreeSet::new));

        var permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getName)
                .collect(Collectors.toCollection(TreeSet::new));

        return new MeResponse(user.getId(), user.getUsername(), user.getEmail(),
                user.getFirstName(), user.getLastName(), roles, permissions,
                user.isTotpEnabled(), user.getHrStepUpExpiresAt());
    }

    public List<UserSummaryResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserSummaryResponse(
                        u.getId(), u.getUsername(), u.getEmail(), u.getFirstName(), u.getLastName(),
                        u.isEnabled(),
                        u.getRoles().stream().map(Role::getName).collect(Collectors.toCollection(TreeSet::new))))
                .toList();
    }
}
