package com.uniservice.org.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.auth.entity.User;
import com.uniservice.hr.security.HrStepUpGuard;
import com.uniservice.org.entity.ChangeRequestAction;
import com.uniservice.org.entity.ChangeRequestStatus;
import com.uniservice.org.entity.OrgUnitChangeRequest;
import com.uniservice.org.entity.OrgUnitType;
import com.uniservice.org.service.OrgChangeRequestService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrgChangeRequestController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class, HrStepUpGuard.class})
class OrgChangeRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrgChangeRequestService changeRequestService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    /**
     * @WithMockUser's principal is a generic Spring Security User, not our UserPrincipal, so
     * @AuthenticationPrincipal UserPrincipal resolves to null under it. Tests that need the
     * controller to actually read principal.getUser() must authenticate with a real UserPrincipal instead.
     */
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

    private OrgUnitChangeRequest sampleRequest() {
        User requester = new User();
        requester.setId(1L);
        requester.setUsername("hr");
        OrgUnitChangeRequest request = OrgUnitChangeRequest.builder()
                .action(ChangeRequestAction.CREATE)
                .proposedName("Engineering")
                .proposedCode("ENG")
                .proposedType(OrgUnitType.FACULTY)
                .status(ChangeRequestStatus.PENDING)
                .requestedBy(requester)
                .build();
        request.setId(1L);
        return request;
    }

    @Test
    void submit_isOk_forUserWithOrgWrite() throws Exception {
        when(changeRequestService.submit(any(), any())).thenReturn(sampleRequest());

        mockMvc.perform(post("/api/org/change-requests")
                        .with(authentication(authAs("hr", "ORG_WRITE")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"" + ChangeRequestAction.CREATE + "\",\"proposedName\":\"Engineering\",\"proposedCode\":\"ENG\",\"proposedType\":\"" + OrgUnitType.FACULTY + "\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "lecturer", authorities = "STAFF_READ")
    void submit_isForbidden_withoutOrgWrite() throws Exception {
        mockMvc.perform(post("/api/org/change-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"" + ChangeRequestAction.CREATE + "\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void pending_isOk_forSuperAdmin() throws Exception {
        when(changeRequestService.listPending()).thenReturn(List.of());

        mockMvc.perform(get("/api/org/change-requests/pending")
                        .with(authentication(authAs("admin", "ROLE_SYSTEM_ADMIN"))))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "hr", authorities = "ORG_WRITE")
    void pending_isForbidden_forNonAdmin() throws Exception {
        mockMvc.perform(get("/api/org/change-requests/pending")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "hr", authorities = "ORG_WRITE")
    void approve_isForbidden_forNonAdmin() throws Exception {
        mockMvc.perform(post("/api/org/change-requests/1/approve")).andExpect(status().isForbidden());
    }

    @Test
    void reject_isOk_forSuperAdmin() throws Exception {
        when(changeRequestService.reject(anyLong(), any(), any())).thenReturn(sampleRequest());

        mockMvc.perform(post("/api/org/change-requests/1/reject")
                        .with(authentication(authAs("admin", "ROLE_SYSTEM_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Budget not approved\"}"))
                .andExpect(status().isOk());
    }
}
