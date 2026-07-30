package com.uniservice.auth.controller;

import com.uniservice.auth.AuthConstants;
import com.uniservice.auth.dto.LoginResponse;
import com.uniservice.auth.entity.RefreshToken;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.service.JwtService;
import com.uniservice.auth.service.RefreshTokenService;
import com.uniservice.auth.util.RefreshCookieUtil;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class RefreshTokenController {

    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    @PostMapping("/token/refresh")
    public LoginResponse refresh(@CookieValue(name = RefreshCookieUtil.COOKIE_NAME, required = false) String refreshTokenCookie,
                                  HttpServletResponse response) {
        if (refreshTokenCookie == null) {
            throw new BadCredentialsException("Missing refresh token");
        }

        RefreshToken newToken = refreshTokenService.rotate(refreshTokenCookie);
        User user = newToken.getUser();
        RefreshCookieUtil.setCookie(response, newToken.getToken(), newToken.getExpiresAt());

        return LoginResponse.builder()
                .accessToken(jwtService.generateToken(user))
                .tokenType(AuthConstants.TOKEN_TYPE)
                .username(user.getUsername())
                .build();
    }

    @PostMapping("/logout")
    public void logout(@CookieValue(name = RefreshCookieUtil.COOKIE_NAME, required = false) String refreshTokenCookie,
                        HttpServletResponse response) {
        if (refreshTokenCookie != null) {
            refreshTokenService.revokeToken(refreshTokenCookie);
        }
        RefreshCookieUtil.clearCookie(response);
    }
}
