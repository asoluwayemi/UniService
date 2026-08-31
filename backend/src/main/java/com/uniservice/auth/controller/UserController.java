package com.uniservice.auth.controller;

import com.uniservice.auth.dto.MeResponse;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserQueryService userQueryService;

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return userQueryService.getCurrentUser(principal);
    }
}
