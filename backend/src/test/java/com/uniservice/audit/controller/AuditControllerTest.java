package com.uniservice.audit.controller;

import com.uniservice.audit.dto.AuditPageResponse;
import com.uniservice.audit.service.AuditService;
import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuditController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class AuditControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private AuditService auditService;
    @MockBean private JwtService jwtService;
    @MockBean private UserDetailsService userDetailsService;

    @Test
    @WithMockUser(authorities = "AUDIT_VIEW")
    void list_returnsPageForAuditViewers() throws Exception {
        when(auditService.search("bob", "USER_CREATED", 1, 10))
                .thenReturn(new AuditPageResponse(List.of(), 1, 10, 0, 0));

        mockMvc.perform(get("/api/audit?actor=bob&action=USER_CREATED&page=1&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1));
        verify(auditService).search("bob", "USER_CREATED", 1, 10);
    }

    @Test
    @WithMockUser(authorities = "STAFF_READ")
    void list_forbiddenWithoutAuditView() throws Exception {
        mockMvc.perform(get("/api/audit")).andExpect(status().isForbidden());
    }

    @Test
    void list_unauthenticatedIsRejected() throws Exception {
        mockMvc.perform(get("/api/audit")).andExpect(status().isUnauthorized());
    }
}
