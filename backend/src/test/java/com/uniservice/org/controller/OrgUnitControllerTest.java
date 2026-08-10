package com.uniservice.org.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.auth.service.UserQueryService;
import com.uniservice.hr.security.HrStepUpGuard;
import com.uniservice.org.service.OrgUnitService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrgUnitController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class, HrStepUpGuard.class})
class OrgUnitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrgUnitService orgUnitService;

    @MockBean
    private UserQueryService userQueryService;

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

    @Test
    void list_isOk_forUserWithOrgRead() throws Exception {
        when(orgUnitService.listVisible(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/org/units").with(authentication(authAs("hr", "ORG_READ"))))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "lecturer", authorities = "STAFF_READ")
    void list_isForbidden_withoutOrgRead() throws Exception {
        mockMvc.perform(get("/api/org/units")).andExpect(status().isForbidden());
    }

    @Test
    void list_isUnauthorized_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/org/units")).andExpect(status().isUnauthorized());
    }

    @Test
    void assignableHeads_isOk_forUserWithOrgWrite() throws Exception {
        when(userQueryService.listUsers()).thenReturn(List.of());

        mockMvc.perform(get("/api/org/units/assignable-heads").with(authentication(authAs("registrar", "ORG_WRITE"))))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "hr", authorities = "ORG_READ")
    void assignableHeads_isForbidden_withOnlyOrgRead() throws Exception {
        mockMvc.perform(get("/api/org/units/assignable-heads")).andExpect(status().isForbidden());
    }
}
