package com.uniservice.payroll.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.payroll.dto.GeneratePayrollRequest;
import com.uniservice.payroll.dto.PayrollRunResponse;
import com.uniservice.payroll.dto.PayslipResponse;
import com.uniservice.payroll.service.PayrollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService service;

    @GetMapping("/payslips/mine")
    public List<PayslipResponse> mine(@AuthenticationPrincipal UserPrincipal p) {
        return service.mine(p.getUser());
    }

    @GetMapping("/runs")
    @PreAuthorize("hasAuthority('PAYROLL_MANAGE')")
    public List<PayrollRunResponse> runs() {
        return service.listRuns();
    }

    @PostMapping("/runs")
    @PreAuthorize("hasAuthority('PAYROLL_MANAGE')")
    public PayrollRunResponse generate(@Valid @RequestBody GeneratePayrollRequest r, @AuthenticationPrincipal UserPrincipal p) {
        return service.generate(r.period(), p.getUser());
    }

    @PostMapping("/runs/{id}/publish")
    @PreAuthorize("hasAuthority('PAYROLL_MANAGE')")
    public PayrollRunResponse publish(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal p) {
        return service.publish(id, p.getUser());
    }

    @GetMapping("/runs/{id}/payslips")
    @PreAuthorize("hasAuthority('PAYROLL_MANAGE')")
    public List<PayslipResponse> payslips(@PathVariable Long id) {
        return service.payslipsForRun(id);
    }
}
