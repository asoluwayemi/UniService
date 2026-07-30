package com.uniservice.auth.controller;

import com.uniservice.auth.dto.MeResponse;
import com.uniservice.auth.dto.UserSummaryResponse;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserQueryService userQueryService;

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return userQueryService.getCurrentUser(principal);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public List<UserSummaryResponse> users() {
        return userQueryService.listUsers();
    }
}
