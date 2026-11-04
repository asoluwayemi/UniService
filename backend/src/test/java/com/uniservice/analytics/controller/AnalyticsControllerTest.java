package com.uniservice.analytics.controller;

import com.uniservice.analytics.dto.AnalyticsResponse;
import com.uniservice.analytics.service.AnalyticsService;
import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class AnalyticsControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private AnalyticsService service;
    @MockBean private JwtService jwtService;
    @MockBean private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String... authorities) {
        User user = new User();
        user.setId(1L);
        user.setUsername("u");
        return new UsernamePasswordAuthenticationToken(UserPrincipal.of(user), null,
                List.of(authorities).stream().map(SimpleGrantedAuthority::new).toList());
    }

    @Test
    @SuppressWarnings("unchecked")
    void passesTheCallersAuthoritiesToTheService() throws Exception {
        when(service.build(any())).thenReturn(new AnalyticsResponse(Instant.now(), null, null, null, null, null, null, null));

        mockMvc.perform(get("/api/analytics").with(authentication(authAs("ANALYTICS_VIEW", "PAYROLL_MANAGE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.generatedAt").exists());

        ArgumentCaptor<Set<String>> captor = ArgumentCaptor.forClass(Set.class);
        verify(service).build(captor.capture());
        assertThat(captor.getValue()).containsExactlyInAnyOrder("ANALYTICS_VIEW", "PAYROLL_MANAGE");
    }

    @Test
    void forbiddenWithoutAnalyticsView() throws Exception {
        mockMvc.perform(get("/api/analytics").with(authentication(authAs("PAYROLL_MANAGE"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticated_isRejected() throws Exception {
        mockMvc.perform(get("/api/analytics")).andExpect(status().isUnauthorized());
    }
}
