package com.uniservice.auth.controller;

import com.uniservice.auth.dto.*;
import com.uniservice.auth.service.*;
import com.uniservice.auth.util.RefreshCookieUtil;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RegisterService registerService;
    private final PasswordService passwordService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResult result = authService.login(request);
        RefreshCookieUtil.setCookie(response, result.refreshToken().getToken(), result.refreshToken().getExpiresAt());
        return result.response();
    }

    @PostMapping("/register")
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return registerService.register(request);
    }

    @PostMapping("/change-password")
    public void changePassword(Authentication authentication,
                               @Valid @RequestBody PasswordChangeRequest request) {
        passwordService.changePassword(authentication.getName(), request);
    }
}
