package com.uniservice.leave.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.leave.dto.LeaveBalanceResponse;
import com.uniservice.leave.dto.LeaveRequestResponse;
import com.uniservice.leave.entity.LeaveStatus;
import com.uniservice.leave.entity.LeaveType;
import com.uniservice.leave.service.LeaveRequestService;
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

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LeaveRequestController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class LeaveRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LeaveRequestService leaveRequestService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String username) {
        User user = new User();
        user.setId(1L);
        user.setUsername(username);
        UserPrincipal principal = UserPrincipal.of(user);
        return new UsernamePasswordAuthenticationToken(principal, null, List.of(new SimpleGrantedAuthority("STAFF")));
    }

    private LeaveRequestResponse sampleResponse() {
        return new LeaveRequestResponse(1L, 1L, "Jane Doe", LeaveType.ANNUAL, LocalDate.now(), LocalDate.now().plusDays(2),
                3, "Rest", LeaveStatus.PENDING, null, null, null, null, null, null, "NOT_REQUIRED",
                null, null, null, null, false, "NOT_ELIGIBLE", null, null);
    }

    @Test
    void getBalance_isOk_forAuthenticatedUser() throws Exception {
        when(leaveRequestService.getLeaveBalance(any())).thenReturn(new LeaveBalanceResponse(10, 30, 5, 25));

        mockMvc.perform(get("/api/leave-requests/balance").with(authentication(authAs("jdoe"))))
                .andExpect(status().isOk());
    }

    @Test
    void getBalance_isUnauthorized_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/leave-requests/balance")).andExpect(status().isUnauthorized());
    }

    @Test
    void create_isOk_forAuthenticatedUser() throws Exception {
        when(leaveRequestService.create(any(), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/leave-requests")
                        .with(authentication(authAs("jdoe")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"leaveType\":\"ANNUAL\",\"startDate\":\"2027-01-01\",\"endDate\":\"2027-01-03\",\"reason\":\"Rest\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void create_isBadRequest_whenReasonMissing() throws Exception {
        mockMvc.perform(post("/api/leave-requests")
                        .with(authentication(authAs("jdoe")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"leaveType\":\"ANNUAL\",\"startDate\":\"2027-01-01\",\"endDate\":\"2027-01-03\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void approve_isOk_forAuthenticatedUser() throws Exception {
        when(leaveRequestService.approve(any(), any(), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/leave-requests/1/approve")
                        .with(authentication(authAs("hr")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"ok\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void cancel_isOk_forAuthenticatedUser() throws Exception {
        when(leaveRequestService.cancel(any(), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/leave-requests/1/cancel").with(authentication(authAs("jdoe"))))
                .andExpect(status().isOk());
    }
}
