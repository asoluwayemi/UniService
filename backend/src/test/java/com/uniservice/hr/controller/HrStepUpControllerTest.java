package com.uniservice.hr.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.hr.dto.HrStepUpResponse;
import com.uniservice.hr.security.HrStepUpGuard;
import com.uniservice.hr.service.HrStepUpService;
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

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HrStepUpController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class, HrStepUpGuard.class})
class HrStepUpControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HrStepUpService hrStepUpService;

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
    void verify_isForbidden_withoutHrPortalAccess() throws Exception {
        mockMvc.perform(post("/api/hr/step-up/verify")
                        .with(authentication(authAs("jdoe", "STAFF_READ")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"123456\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void verify_isOk_withHrPortalAccess() throws Exception {
        when(hrStepUpService.verify(any(), anyString())).thenReturn(new HrStepUpResponse(Instant.now().plusSeconds(900)));

        mockMvc.perform(post("/api/hr/step-up/verify")
                        .with(authentication(authAs("hr", "HR_PORTAL_ACCESS")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"123456\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void exit_isOk_withHrPortalAccess() throws Exception {
        mockMvc.perform(post("/api/hr/step-up/exit").with(authentication(authAs("hr", "HR_PORTAL_ACCESS"))))
                .andExpect(status().isOk());

        verify(hrStepUpService).exit(any());
    }

    @Test
    void exit_isForbidden_withoutHrPortalAccess() throws Exception {
        mockMvc.perform(post("/api/hr/step-up/exit").with(authentication(authAs("jdoe", "STAFF_READ"))))
                .andExpect(status().isForbidden());
    }
}
