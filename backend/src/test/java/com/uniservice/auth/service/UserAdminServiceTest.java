package com.uniservice.auth.service;

import com.uniservice.auth.dto.CreateUserRequest;
import com.uniservice.auth.dto.UserSummaryResponse;
import com.uniservice.auth.entity.Role;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.RoleRepository;
import com.uniservice.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAdminServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private UserAdminService service;

    private Role systemAdminRole;
    private Role hrAdminRole;
    private Role hrStaffRole;

    @BeforeEach
    void setUp() {
        service = new UserAdminService(userRepository, roleRepository, passwordEncoder);

        systemAdminRole = Role.builder().name("SYSTEM_ADMIN").build();
        systemAdminRole.setId(1L);
        hrAdminRole = Role.builder().name("HR_ADMIN").build();
        hrAdminRole.setId(2L);
        hrStaffRole = Role.builder().name("HR_STAFF").build();
        hrStaffRole.setId(3L);
    }

    private CreateUserRequest request(String username, Set<String> roleNames) {
        CreateUserRequest r = new CreateUserRequest();
        r.setUsername(username);
        r.setEmail(username + "@uniservice.local");
        r.setPassword("Password123!");
        r.setFirstName("F");
        r.setLastName("L");
        r.setRoleNames(roleNames);
        return r;
    }

    private User actorWithRole(Role role) {
        User actor = new User();
        actor.setId(99L);
        actor.setRoles(new HashSet<>(Set.of(role)));
        return actor;
    }

    @Test
    void createUser_hrAdminActor_assigningHrStaff_succeeds() {
        User actor = actorWithRole(hrAdminRole);
        CreateUserRequest req = request("newhr", Set.of("HR_STAFF"));
        when(userRepository.existsByUsername("newhr")).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findByName("HR_STAFF")).thenReturn(Optional.of(hrStaffRole));
        when(passwordEncoder.encode("Password123!")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(10L);
            return u;
        });

        UserSummaryResponse result = service.createUser(req, actor);

        assertThat(result.roles()).containsExactly("HR_STAFF");
    }

    @Test
    void createUser_hrAdminActor_assigningSystemAdmin_throwsAccessDenied() {
        User actor = actorWithRole(hrAdminRole);
        CreateUserRequest req = request("sneaky", Set.of("SYSTEM_ADMIN"));
        when(userRepository.existsByUsername("sneaky")).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findByName("SYSTEM_ADMIN")).thenReturn(Optional.of(systemAdminRole));

        assertThatThrownBy(() -> service.createUser(req, actor))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createUser_systemAdminActor_canAssignAnyRole() {
        User actor = actorWithRole(systemAdminRole);
        CreateUserRequest req = request("newadmin", Set.of("SYSTEM_ADMIN"));
        when(userRepository.existsByUsername("newadmin")).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findByName("SYSTEM_ADMIN")).thenReturn(Optional.of(systemAdminRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(11L);
            return u;
        });

        UserSummaryResponse result = service.createUser(req, actor);

        assertThat(result.roles()).containsExactly("SYSTEM_ADMIN");
    }

    @Test
    void createUser_duplicateUsername_throws() {
        User actor = actorWithRole(systemAdminRole);
        CreateUserRequest req = request("existing", Set.of("HR_STAFF"));
        when(userRepository.existsByUsername("existing")).thenReturn(true);

        assertThatThrownBy(() -> service.createUser(req, actor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already taken");
    }
}
