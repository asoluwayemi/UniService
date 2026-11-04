package com.uniservice.recruitment.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.recruitment.dto.JobPostingResponse;
import com.uniservice.recruitment.entity.PostingCategory;
import com.uniservice.recruitment.entity.PostingStatus;
import com.uniservice.recruitment.service.RecruitmentService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RecruitmentController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class RecruitmentControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private RecruitmentService service;
    @MockBean private JwtService jwtService;
    @MockBean private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String authority) {
        User user = new User();
        user.setId(1L);
        user.setUsername("hr");
        return new UsernamePasswordAuthenticationToken(UserPrincipal.of(user), null, List.of(new SimpleGrantedAuthority(authority)));
    }

    private static final String VALID_POSTING =
            "{\"title\":\"Lecturer\",\"department\":\"Physics\",\"category\":\"ACADEMIC\",\"description\":\"d\"}";

    @Test
    void createPosting_forRecruiter() throws Exception {
        when(service.createPosting(any(), any())).thenReturn(
                new JobPostingResponse(1L, "Lecturer", "Physics", PostingCategory.ACADEMIC, "d", PostingStatus.DRAFT, null, 0));

        mockMvc.perform(post("/api/recruitment/postings").with(authentication(authAs("RECRUITMENT_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_POSTING))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void createPosting_validatesBody() throws Exception {
        mockMvc.perform(post("/api/recruitment/postings").with(authentication(authAs("RECRUITMENT_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void application_validatesEmail() throws Exception {
        mockMvc.perform(post("/api/recruitment/postings/1/applications").with(authentication(authAs("RECRUITMENT_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"applicantName\":\"Ada\",\"email\":\"nope\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void everyEndpoint_forbiddenWithoutPermission() throws Exception {
        mockMvc.perform(get("/api/recruitment/postings").with(authentication(authAs("STAFF"))))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/recruitment/applications/1/stage").with(authentication(authAs("STAFF")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"stage\":\"SHORTLISTED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticated_isRejected() throws Exception {
        mockMvc.perform(get("/api/recruitment/postings")).andExpect(status().isUnauthorized());
    }
}
