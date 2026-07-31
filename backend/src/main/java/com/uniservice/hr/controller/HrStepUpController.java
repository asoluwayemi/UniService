package com.uniservice.hr.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.hr.dto.HrStepUpRequest;
import com.uniservice.hr.dto.HrStepUpResponse;
import com.uniservice.hr.service.HrStepUpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hr/step-up")
@RequiredArgsConstructor
public class HrStepUpController {

    private final HrStepUpService hrStepUpService;

    @PostMapping("/verify")
    @PreAuthorize("hasAuthority('HR_PORTAL_ACCESS')")
    public HrStepUpResponse verify(@Valid @RequestBody HrStepUpRequest request,
                                    @AuthenticationPrincipal UserPrincipal principal) {
        return hrStepUpService.verify(principal.getUser(), request.getCode());
    }

    @PostMapping("/exit")
    @PreAuthorize("hasAuthority('HR_PORTAL_ACCESS')")
    public void exit(@AuthenticationPrincipal UserPrincipal principal) {
        hrStepUpService.exit(principal.getUser());
    }
}
