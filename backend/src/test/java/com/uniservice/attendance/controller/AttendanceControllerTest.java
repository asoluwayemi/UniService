package com.uniservice.attendance.controller;

import com.uniservice.attendance.dto.AttendanceRecordResponse;
import com.uniservice.attendance.service.AttendanceService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AttendanceController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class AttendanceControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private AttendanceService attendanceService;
    @MockBean private JwtService jwtService;
    @MockBean private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String... authorities) {
        User user = new User();
        user.setId(1L);
        user.setUsername("jdoe");
        return new UsernamePasswordAuthenticationToken(UserPrincipal.of(user), null,
                List.of(authorities).stream().map(SimpleGrantedAuthority::new).toList());
    }

    private AttendanceRecordResponse sample() {
        return new AttendanceRecordResponse(1L, "jdoe", "Jane Doe", LocalDate.now(), Instant.now(), null, false, null);
    }

    @Test
    void clockIn_returnsRecord() throws Exception {
        when(attendanceService.clockIn(any())).thenReturn(sample());
        mockMvc.perform(post("/api/attendance/clock-in").with(authentication(authAs("STAFF"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("jdoe"));
    }

    @Test
    void clockIn_unauthenticated_isRejected() throws Exception {
        mockMvc.perform(post("/api/attendance/clock-in")).andExpect(status().isUnauthorized());
    }

    @Test
    void byDate_requiresViewAll() throws Exception {
        mockMvc.perform(get("/api/attendance").with(authentication(authAs("STAFF"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void byDate_allowedForViewAll() throws Exception {
        when(attendanceService.forDate(any())).thenReturn(List.of(sample()));
        mockMvc.perform(get("/api/attendance?date=2027-03-10").with(authentication(authAs("ATTENDANCE_VIEW_ALL"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").value("Jane Doe"));
    }
}
