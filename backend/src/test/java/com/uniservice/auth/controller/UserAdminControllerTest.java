package com.uniservice.auth.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.dto.UserSummaryResponse;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.auth.service.UserAdminService;
import com.uniservice.hr.security.HrStepUpGuard;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserAdminController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class, HrStepUpGuard.class})
class UserAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserAdminService userAdminService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    private static final String BODY =
            "{\"username\":\"newhr\",\"email\":\"newhr@uniservice.local\",\"password\":\"Password123!\",\"firstName\":\"F\",\"lastName\":\"L\",\"roleNames\":[\"HR_STAFF\"]}";

    private UsernamePasswordAuthenticationToken authAs(boolean steppedUp, String... authorities) {
        User user = new User();
        user.setId(1L);
        user.setUsername("hr");
        if (steppedUp) {
            user.setHrStepUpExpiresAt(Instant.now().plus(Duration.ofMinutes(15)));
        }
        UserPrincipal principal = UserPrincipal.of(user);
        List<SimpleGrantedAuthority> grantedAuthorities = List.of(authorities).stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
        return new UsernamePasswordAuthenticationToken(principal, null, grantedAuthorities);
    }

    @Test
    void create_isForbidden_withHrUserManageButWithoutStepUp() throws Exception {
        mockMvc.perform(post("/api/auth/users")
                        .with(authentication(authAs(false, "HR_USER_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_isForbidden_withoutHrUserManageEvenWithStepUp() throws Exception {
        mockMvc.perform(post("/api/auth/users")
                        .with(authentication(authAs(true, "STAFF_READ")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_isOk_withHrUserManageAndStepUp() throws Exception {
        when(userAdminService.createUser(any(), any())).thenReturn(
                new UserSummaryResponse(10L, "newhr", "newhr@uniservice.local", "F", "L", true,
                        new TreeSet<>(Set.of("HR_STAFF"))));

        mockMvc.perform(post("/api/auth/users")
                        .with(authentication(authAs(true, "HR_USER_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isOk());
    }
}
