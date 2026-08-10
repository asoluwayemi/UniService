package com.uniservice.staff.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.hr.security.HrStepUpGuard;
import com.uniservice.staff.dto.StaffProfileResponse;
import com.uniservice.staff.entity.EmploymentStatus;
import com.uniservice.staff.entity.EmploymentType;
import com.uniservice.staff.entity.StaffCategory;
import com.uniservice.staff.service.StaffProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StaffProfileController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class, HrStepUpGuard.class})
class StaffProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StaffProfileService staffProfileService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String username, String... authorities) {
        User user = new User();
        user.setId(1L);
        user.setUsername(username);
        user.setHrStepUpExpiresAt(java.time.Instant.now().plus(java.time.Duration.ofMinutes(15)));
        UserPrincipal principal = UserPrincipal.of(user);
        List<SimpleGrantedAuthority> grantedAuthorities = List.of(authorities).stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
        return new UsernamePasswordAuthenticationToken(principal, null, grantedAuthorities);
    }

    private UsernamePasswordAuthenticationToken authAsWithoutStepUp(String username, String... authorities) {
        User user = new User();
        user.setId(1L);
        user.setUsername(username);
        UserPrincipal principal = UserPrincipal.of(user);
        List<SimpleGrantedAuthority> grantedAuthorities = List.of(authorities).stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
        return new UsernamePasswordAuthenticationToken(principal, null, grantedAuthorities);
    }

    private StaffProfileResponse sampleResponse() {
        return new StaffProfileResponse(1L, 1L, "jdoe", "Jane", "Doe", "jdoe@uniservice.local",
                "STAFF-0001", null, null, null, null, null, StaffCategory.ACADEMIC, "Lecturer",
                null, null, EmploymentType.FULL_TIME, EmploymentStatus.ACTIVE,
                LocalDate.of(2024, 1, 15), null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null, null, 0, false, List.of(), List.of());
    }

    @Test
    void list_isOk_forUserWithStaffRead() throws Exception {
        when(staffProfileService.listAll(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/staff").with(authentication(authAs("hr", "STAFF_READ"))))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "jdoe", authorities = "STAFF_WRITE")
    void list_isForbidden_withoutStaffRead() throws Exception {
        mockMvc.perform(get("/api/staff")).andExpect(status().isForbidden());
    }

    @Test
    void me_isOk_forAnyAuthenticatedUser() throws Exception {
        when(staffProfileService.getMine(any())).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/staff/me").with(authentication(authAs("jdoe"))))
                .andExpect(status().isOk());
    }

    @Test
    void me_isUnauthorized_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/staff/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void create_isOk_forUserWithStaffWrite() throws Exception {
        when(staffProfileService.create(any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/staff")
                        .with(authentication(authAs("hr", "STAFF_WRITE")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":1,\"staffNumber\":\"STAFF-0001\",\"category\":\"ACADEMIC\",\"employmentType\":\"FULL_TIME\",\"dateOfHire\":\"2024-01-15\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "hr", authorities = "STAFF_READ")
    void create_isForbidden_withoutStaffWrite() throws Exception {
        mockMvc.perform(post("/api/staff")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":1,\"staffNumber\":\"STAFF-0001\",\"category\":\"ACADEMIC\",\"employmentType\":\"FULL_TIME\",\"dateOfHire\":\"2024-01-15\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_isForbidden_withStaffWriteButWithoutHrStepUp() throws Exception {
        mockMvc.perform(post("/api/staff")
                        .with(authentication(authAsWithoutStepUp("hr", "STAFF_WRITE")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":1,\"staffNumber\":\"STAFF-0001\",\"category\":\"ACADEMIC\",\"employmentType\":\"FULL_TIME\",\"dateOfHire\":\"2024-01-15\"}"))
                .andExpect(status().isForbidden());
    }
}
