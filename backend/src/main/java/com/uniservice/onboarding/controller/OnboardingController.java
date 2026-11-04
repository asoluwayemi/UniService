package com.uniservice.onboarding.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.onboarding.dto.*;
import com.uniservice.onboarding.service.OnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ONBOARDING_MANAGE')")
public class OnboardingController {

    private final OnboardingService service;

    @GetMapping("/cases")
    public List<OnboardingCaseResponse> list() {
        return service.list();
    }

    @PostMapping("/cases")
    public OnboardingCaseResponse create(@Valid @RequestBody OnboardingCaseRequest r, @AuthenticationPrincipal UserPrincipal p) {
        return service.create(r, p.getUser());
    }

    @PostMapping("/cases/from-application/{applicationId}")
    public OnboardingCaseResponse fromApplication(@PathVariable Long applicationId,
                                                  @Valid @RequestBody FromApplicationRequest r,
                                                  @AuthenticationPrincipal UserPrincipal p) {
        return service.createFromApplication(applicationId, r, p.getUser());
    }

    @PostMapping("/cases/{id}/link-user")
    public OnboardingCaseResponse linkUser(@PathVariable Long id, @Valid @RequestBody LinkUserRequest r,
                                           @AuthenticationPrincipal UserPrincipal p) {
        return service.linkUser(id, r.email(), p.getUser());
    }

    @PostMapping("/cases/{id}/cancel")
    public OnboardingCaseResponse cancel(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal p) {
        return service.cancel(id, p.getUser());
    }

    @PostMapping("/tasks/{id}")
    public OnboardingCaseResponse setTask(@PathVariable Long id, @RequestBody TaskUpdateRequest r,
                                          @AuthenticationPrincipal UserPrincipal p) {
        return service.setTask(id, r.done(), p.getUser());
    }
}
