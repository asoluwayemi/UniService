package com.uniservice.promotion.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.promotion.dto.PromotionApplicationResponse;
import com.uniservice.promotion.entity.PromotionApplicationStatus;
import com.uniservice.promotion.service.PromotionService;
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

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PromotionController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class PromotionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PromotionService promotionService;

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

    private PromotionApplicationResponse sampleResponse() {
        return new PromotionApplicationResponse(1L, 1L, "Jane Doe", "STAFF-0001", 10, 11,
                LocalDate.now(), PromotionApplicationStatus.SUBMITTED, null, null, null, null, null, null, null);
    }

    @Test
    @WithMockUser(username = "jdoe")
    void listAll_isForbidden_withoutPromotionManage() throws Exception {
        mockMvc.perform(get("/api/promotions")).andExpect(status().isForbidden());
    }

    @Test
    void listAll_isOk_forUserWithPromotionManage() throws Exception {
        when(promotionService.listAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/promotions").with(authentication(authAs("hr", "PROMOTION_MANAGE"))))
                .andExpect(status().isOk());
    }

    @Test
    void getById_isOk_forAnyAuthenticatedUser() throws Exception {
        when(promotionService.getById(any(), any(), anyBoolean())).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/promotions/1").with(authentication(authAs("jdoe"))))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "jdoe")
    void requestDocuments_isForbidden_withoutPromotionManage() throws Exception {
        mockMvc.perform(post("/api/promotions/1/request-documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"missing transcript\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void approve_isOk_forUserWithPromotionManage() throws Exception {
        when(promotionService.approve(any(), any(), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/promotions/1/approve")
                        .with(authentication(authAs("hr", "PROMOTION_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"approved\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "jdoe")
    void approve_isForbidden_withoutPromotionManage() throws Exception {
        mockMvc.perform(post("/api/promotions/1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"approved\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void scheduleExam_isOk_forUserWithPromotionManage() throws Exception {
        when(promotionService.scheduleExam(any(), any(), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/promotions/1/schedule-exam")
                        .with(authentication(authAs("hr", "PROMOTION_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"examDate\":\"2026-09-01\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void mine_isOk_forAnyAuthenticatedUser() throws Exception {
        when(promotionService.mine(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/promotions/mine").with(authentication(authAs("jdoe"))))
                .andExpect(status().isOk());
    }
}
