package com.uniservice.onboarding.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.onboarding.service.OnboardingService;
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

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OnboardingController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class OnboardingControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private OnboardingService service;
    @MockBean private JwtService jwtService;
    @MockBean private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String authority) {
        User user = new User();
        user.setId(1L);
        user.setUsername("hr");
        return new UsernamePasswordAuthenticationToken(UserPrincipal.of(user), null, List.of(new SimpleGrantedAuthority(authority)));
    }

    @Test
    void list_forOnboardingManagers() throws Exception {
        when(service.list()).thenReturn(List.of());
        mockMvc.perform(get("/api/onboarding/cases").with(authentication(authAs("ONBOARDING_MANAGE"))))
                .andExpect(status().isOk());
    }

    @Test
    void create_validatesBody() throws Exception {
        mockMvc.perform(post("/api/onboarding/cases").with(authentication(authAs("ONBOARDING_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"newHireName\":\"\",\"email\":\"bad\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void everyEndpoint_forbiddenWithoutPermission() throws Exception {
        mockMvc.perform(get("/api/onboarding/cases").with(authentication(authAs("STAFF"))))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/onboarding/tasks/1").with(authentication(authAs("STAFF")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"done\":true}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticated_isRejected() throws Exception {
        mockMvc.perform(get("/api/onboarding/cases")).andExpect(status().isUnauthorized());
    }
}
