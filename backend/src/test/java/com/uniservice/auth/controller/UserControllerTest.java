package com.uniservice.auth.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.dto.MeResponse;
import com.uniservice.auth.service.JwtService;
import com.uniservice.auth.service.UserQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserQueryService userQueryService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    @WithMockUser(username = "jdoe", roles = "ACADEMIC_STAFF")
    void me_returnsCurrentUser_forAuthenticatedUser() throws Exception {
        when(userQueryService.getCurrentUser(any())).thenReturn(
                new MeResponse(1L, "jdoe", "jdoe@example.com", "Jane", "Doe", Set.of("ACADEMIC_STAFF"), Set.of("STAFF_READ")));

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk());
    }

    @Test
    void me_isUnauthorized_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin", roles = "SYSTEM_ADMIN")
    void users_isOk_forSuperAdmin() throws Exception {
        when(userQueryService.listUsers()).thenReturn(List.of());

        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "jdoe", roles = "ACADEMIC_STAFF")
    void users_isForbidden_forNonAdmin() throws Exception {
        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isForbidden());
    }
}
