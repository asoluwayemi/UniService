package com.uniservice.payroll.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.payroll.dto.PayrollRunResponse;
import com.uniservice.payroll.entity.PayrollRunStatus;
import com.uniservice.payroll.service.PayrollService;
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

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PayrollController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class PayrollControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private PayrollService payrollService;
    @MockBean private JwtService jwtService;
    @MockBean private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String... authorities) {
        User user = new User();
        user.setId(1L);
        user.setUsername("finance");
        return new UsernamePasswordAuthenticationToken(UserPrincipal.of(user), null,
                List.of(authorities).stream().map(SimpleGrantedAuthority::new).toList());
    }

    private PayrollRunResponse run() {
        return new PayrollRunResponse(5L, "2027-03", PayrollRunStatus.DRAFT, 1, 0,
                new BigDecimal("140000.00"), new BigDecimal("122200.00"), "finance", null);
    }

    @Test
    void generate_forPayrollManager() throws Exception {
        when(payrollService.generate(eq("2027-03"), any())).thenReturn(run());

        mockMvc.perform(post("/api/payroll/runs").with(authentication(authAs("PAYROLL_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"period\":\"2027-03\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("2027-03"));
    }

    @Test
    void generate_rejectsBadPeriod() throws Exception {
        mockMvc.perform(post("/api/payroll/runs").with(authentication(authAs("PAYROLL_MANAGE")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"period\":\"March\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void generate_forbiddenWithoutPermission() throws Exception {
        mockMvc.perform(post("/api/payroll/runs").with(authentication(authAs("STAFF")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"period\":\"2027-03\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void publishAndListRuns_requirePermission() throws Exception {
        mockMvc.perform(post("/api/payroll/runs/5/publish").with(authentication(authAs("STAFF"))))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/payroll/runs").with(authentication(authAs("STAFF"))))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/payroll/runs/5/payslips").with(authentication(authAs("STAFF"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void myPayslips_availableToAnyAuthenticatedUser() throws Exception {
        when(payrollService.mine(any())).thenReturn(List.of());
        mockMvc.perform(get("/api/payroll/payslips/mine").with(authentication(authAs("STAFF"))))
                .andExpect(status().isOk());
    }

    @Test
    void myPayslips_unauthenticatedIsRejected() throws Exception {
        mockMvc.perform(get("/api/payroll/payslips/mine")).andExpect(status().isUnauthorized());
    }
}
