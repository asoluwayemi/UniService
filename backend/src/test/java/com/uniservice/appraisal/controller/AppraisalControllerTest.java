package com.uniservice.appraisal.controller;

import com.uniservice.appraisal.dto.AppraisalFormResponse;
import com.uniservice.appraisal.dto.AppraisalSummaryResponse;
import com.uniservice.appraisal.entity.AppraisalStatus;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AppraisalController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class AppraisalControllerTest {

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
    void mine_isUnauthorized_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/appraisals/mine").param("cycleId", "1")).andExpect(status().isUnauthorized());
    }

    @Test
    void pending_isOk_forAnyAuthenticatedUser() throws Exception {
        when(appraisalService.listPendingMyAction(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/appraisals/pending").with(authentication(authAs("jdoe", "STAFF_READ"))))
                .andExpect(status().isOk());
    }

    @Test
    void forStaff_isOk_withAppraisalRead() throws Exception {
        when(appraisalService.listForStaff(anyLong(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/appraisals/staff/1").with(authentication(authAs("hr", "APPRAISAL_READ"))))
                .andExpect(status().isOk());
    }

    @Test
    void forStaff_isForbidden_withoutAppraisalRead() throws Exception {
        mockMvc.perform(get("/api/appraisals/staff/1").with(authentication(authAs("jdoe", "STAFF_READ"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getById_isForbidden_whenServiceDeniesAccess() throws Exception {
        when(appraisalService.getById(anyLong(), any())).thenThrow(new AccessDeniedException("nope"));

        mockMvc.perform(get("/api/appraisals/1").with(authentication(authAs("stranger", "STAFF_READ"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getById_isOk_whenAuthorized() throws Exception {
        when(appraisalService.getById(anyLong(), any())).thenReturn(sampleFormResponse());

        mockMvc.perform(get("/api/appraisals/1").with(authentication(authAs("jdoe", "STAFF_READ"))))
                .andExpect(status().isOk());
    }

    private AppraisalFormResponse sampleFormResponse() {
        return new AppraisalFormResponse(
                1L,                            // id
                1L,                            // cycleId
                2026,                          // cycleYear
                1L,                            // staffProfileId
                "Jane Doe",                    // staffFullName
                "STAFF-0001",                  // staffNumber
                AppraisalStatus.STAFF_DRAFT,   // status
                null,                          // scheduleOfDuties
                null, null, null, null,        // rating 1-4
                null, null, null, null,        // rating 5-8
                null, null, null, null, null,  // rating 9-13 (13 ratings total)
                null,                          // loyaltyToInstitution
                null,                          // overallGrading
                null,                          // coursesAttended
                null,                          // trainingNeeds
                null,                          // promotability
                null,                          // promotabilityComments
                null,                          // longTermPotentials
                null,                          // generalRemarks
                null,                          // servedUnderReportingOfficerYears
                null,                          // numberOfQueries
                null,                          // pendingDisciplinaryAction
                null,                          // concludedDisciplinaryAction
                null,                          // unitHeadId
                null,                          // unitHeadName
                null,                          // unitHeadPost
                null,                          // unitHeadSignedAt
                null,                          // staffComments
                null,                          // staffCommentedAt
                null,                          // departmentHeadComments
                null,                          // departmentHeadId
                null,                          // departmentHeadName
                null,                          // departmentHeadSignedAt
                List.of(),                     // sickLeaves
                true,                          // viewerIsOwner
                false,                         // viewerIsUnitHead
                false                          // viewerIsDepartmentHead
        );
    }
}
