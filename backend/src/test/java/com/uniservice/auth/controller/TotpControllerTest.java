package com.uniservice.auth.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.dto.TotpSetupResponse;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.auth.service.TotpEnrollmentService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TotpController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class TotpControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TotpEnrollmentService enrollmentService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String username) {
        User user = new User();
        user.setId(1L);
        user.setUsername(username);
        UserPrincipal principal = UserPrincipal.of(user);
        return new UsernamePasswordAuthenticationToken(principal, null, List.of(new SimpleGrantedAuthority("STAFF_READ")));
    }

    @Test
    void setup_isUnauthorized_whenNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/auth/totp/setup")).andExpect(status().isUnauthorized());
    }

    @Test
    void setup_isOk_forAuthenticatedUser() throws Exception {
        when(enrollmentService.beginEnrollment(any())).thenReturn(new TotpSetupResponse("SECRET", "otpauth://totp/x", "data:image/png;base64,x"));

        mockMvc.perform(post("/api/auth/totp/setup").with(authentication(authAs("jdoe"))))
                .andExpect(status().isOk());
    }

    @Test
    void confirm_isBadRequest_whenCodeBlank() throws Exception {
        mockMvc.perform(post("/api/auth/totp/confirm")
                        .with(authentication(authAs("jdoe")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void confirm_isOk_withValidCode() throws Exception {
        mockMvc.perform(post("/api/auth/totp/confirm")
                        .with(authentication(authAs("jdoe")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"123456\"}"))
                .andExpect(status().isOk());
    }
}
