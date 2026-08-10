package com.uniservice.auth.controller;

import com.uniservice.auth.dto.DisableTotpRequest;
import com.uniservice.auth.dto.TotpCodeRequest;
import com.uniservice.auth.dto.TotpSetupResponse;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.TotpEnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/totp")
@RequiredArgsConstructor
public class TotpController {

    private final TotpEnrollmentService enrollmentService;

    @PostMapping("/setup")
    public TotpSetupResponse setup(@AuthenticationPrincipal UserPrincipal principal) {
        return enrollmentService.beginEnrollment(principal.getUser());
    }

    @PostMapping("/confirm")
    public void confirm(@Valid @RequestBody TotpCodeRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        enrollmentService.confirmEnrollment(principal.getUser(), request.getCode());
    }

    @PostMapping("/disable")
    public void disable(@Valid @RequestBody DisableTotpRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        enrollmentService.disable(principal.getUser(), request.getPassword());
    }
}
