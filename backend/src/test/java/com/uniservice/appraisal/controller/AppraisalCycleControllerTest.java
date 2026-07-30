package com.uniservice.appraisal.controller;

import com.uniservice.appraisal.dto.AppraisalCycleResponse;
import com.uniservice.appraisal.entity.AppraisalCycleStatus;
import com.uniservice.appraisal.service.AppraisalService;
import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
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
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AppraisalCycleController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class AppraisalCycleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AppraisalService appraisalService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String username, String... authorities) {
        User user = new User();
        user.setId(1L);
        user.setUsername(username);
        UserPrincipal principal = UserPrincipal.of(user);
        List<SimpleGrantedAuthority> grantedAuthorities = List.of(authorities).stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
        return new UsernamePasswordAuthenticationToken(principal, null, grantedAuthorities);
    }

    @Test
    @WithMockUser(username = "jdoe", authorities = "STAFF_READ")
    void list_isOk_forAnyAuthenticatedUser() throws Exception {
        when(appraisalService.listCycles()).thenReturn(List.of(new AppraisalCycleResponse(1L, 2026, AppraisalCycleStatus.OPEN)));

        mockMvc.perform(get("/api/appraisal-cycles")).andExpect(status().isOk());
    }

    @Test
    void create_isOk_forUserWithAppraisalManage() throws Exception {
        when(appraisalService.createCycle(any())).thenReturn(new AppraisalCycleResponse(1L, 2026, AppraisalCycleStatus.OPEN));

        mockMvc.perform(post("/api/appraisal-cycles")
                        .with(authentication(authAs("hr", "APPRAISAL_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"year\":2026}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "jdoe", authorities = "STAFF_READ")
    void create_isForbidden_withoutAppraisalManage() throws Exception {
        mockMvc.perform(post("/api/appraisal-cycles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"year\":2026}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "jdoe", authorities = "STAFF_READ")
    void close_isForbidden_withoutAppraisalManage() throws Exception {
        mockMvc.perform(post("/api/appraisal-cycles/1/close")).andExpect(status().isForbidden());
    }
}
