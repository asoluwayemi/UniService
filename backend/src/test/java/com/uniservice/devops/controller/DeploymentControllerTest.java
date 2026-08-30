package com.uniservice.devops.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.devops.dto.DeploymentRunResponse;
import com.uniservice.devops.entity.DeploymentRunStatus;
import com.uniservice.devops.entity.DeploymentRunType;
import com.uniservice.devops.service.DeploymentService;
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

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DeploymentController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class DeploymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DeploymentService deploymentService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String username, String... authorities) {
        User user = new User();
        user.setId(1L);
        user.setUsername(username);
        UserPrincipal principal = UserPrincipal.of(user);
        List<SimpleGrantedAuthority> granted = List.of(authorities).stream().map(SimpleGrantedAuthority::new).toList();
        return new UsernamePasswordAuthenticationToken(principal, null, granted);
    }

    private DeploymentRunResponse sampleResponse(DeploymentRunType type) {
        return new DeploymentRunResponse(1L, type, DeploymentRunStatus.RUNNING, "developer", null, Instant.now(), null);
    }

    @Test
    @WithMockUser(username = "jdoe", authorities = "STAFF_READ")
    void push_isForbidden_withoutDeploymentTrigger() throws Exception {
        mockMvc.perform(post("/api/devops/push")).andExpect(status().isForbidden());
    }

    @Test
    void push_isOk_forUserWithDeploymentTrigger() throws Exception {
        when(deploymentService.triggerPush(any())).thenReturn(sampleResponse(DeploymentRunType.PUSH));

        mockMvc.perform(post("/api/devops/push").with(authentication(authAs("developer", "DEPLOYMENT_TRIGGER"))))
                .andExpect(status().isOk());
    }

    @Test
    void deploy_isOk_forUserWithDeploymentTrigger() throws Exception {
        when(deploymentService.triggerDeploy(any())).thenReturn(sampleResponse(DeploymentRunType.DEPLOY));

        mockMvc.perform(post("/api/devops/deploy").with(authentication(authAs("developer", "DEPLOYMENT_TRIGGER"))))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "jdoe", authorities = "STAFF_READ")
    void deploy_isForbidden_withoutDeploymentTrigger() throws Exception {
        mockMvc.perform(post("/api/devops/deploy")).andExpect(status().isForbidden());
    }

    @Test
    void latestDeploy_isOk_forUserWithDeploymentTrigger() throws Exception {
        when(deploymentService.latest(DeploymentRunType.DEPLOY)).thenReturn(sampleResponse(DeploymentRunType.DEPLOY));

        mockMvc.perform(get("/api/devops/deploy/latest").with(authentication(authAs("developer", "DEPLOYMENT_TRIGGER"))))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "jdoe", authorities = "STAFF_READ")
    void latestPush_isForbidden_withoutDeploymentTrigger() throws Exception {
        mockMvc.perform(get("/api/devops/push/latest")).andExpect(status().isForbidden());
    }
}
