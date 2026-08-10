package com.uniservice.leave.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.leave.dto.*;
import com.uniservice.leave.service.LeaveRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/leave-requests")
@RequiredArgsConstructor
public class LeaveRequestController {
    private final LeaveRequestService service;

    @GetMapping("/balance")
    public LeaveBalanceResponse getBalance(@AuthenticationPrincipal UserPrincipal p) {
        return service.getLeaveBalance(p.getUser());
    }

    @GetMapping("/mine")
    public List<LeaveRequestResponse> mine(@AuthenticationPrincipal UserPrincipal p) {
        return service.mine(p.getUser());
    }

    @PostMapping
    public LeaveRequestResponse create(@Valid @RequestBody CreateLeaveRequest r, @AuthenticationPrincipal UserPrincipal p) {
        return service.create(r, p.getUser());
    }

    @GetMapping("/pending")
    public List<LeaveRequestResponse> pending(@AuthenticationPrincipal UserPrincipal p) {
        return service.pending(p.getUser());
    }

    @GetMapping("/handovers")
    public List<LeaveRequestResponse> handovers(@AuthenticationPrincipal UserPrincipal p) {
        return service.handovers(p.getUser());
    }

    @PostMapping("/{id}/handover/accept")
    public LeaveRequestResponse acceptHandover(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal p) {
        return service.acceptHandover(id, p.getUser());
    }

    @PostMapping("/{id}/approve")
    public LeaveRequestResponse approve(@PathVariable Long id, @Valid @RequestBody ReviewLeaveRequest r, @AuthenticationPrincipal UserPrincipal p) {
        return service.approve(id, r, p.getUser());
    }

    @PostMapping("/{id}/reject")
    public LeaveRequestResponse reject(@PathVariable Long id, @Valid @RequestBody ReviewLeaveRequest r, @AuthenticationPrincipal UserPrincipal p) {
        return service.reject(id, r, p.getUser());
    }

    @PostMapping("/{id}/resumption")
    public LeaveRequestResponse submitResumption(@PathVariable Long id, @Valid @RequestBody SubmitResumptionRequest r, @AuthenticationPrincipal UserPrincipal p) {
        return service.submitResumption(id, r, p.getUser());
    }

    @PostMapping("/{id}/resumption/confirm")
    public LeaveRequestResponse confirmResumption(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal p) {
        return service.confirmResumption(id, p.getUser());
    }

    @PostMapping("/{id}/cancel")
    public LeaveRequestResponse cancel(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal p) {
        return service.cancel(id, p.getUser());
    }
}
