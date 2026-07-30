package com.uniservice.auth.service;

import com.uniservice.auth.AuthConstants;
import com.uniservice.auth.dto.*;
import com.uniservice.auth.entity.*;
import com.uniservice.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Override
    public LoginResult login(LoginRequest request) {

        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                request.getPassword()));

        User user = userRepository
            .findByUsernameOrEmail(request.getUsername(), request.getUsername())
            .orElseThrow();

        refreshTokenService.revokeAll(user);
        RefreshToken refreshToken = refreshTokenService.create(user);

        LoginResponse response = LoginResponse.builder()
            .accessToken(jwtService.generateToken(user))
            .tokenType(AuthConstants.TOKEN_TYPE)
            .username(user.getUsername())
            .build();

        return new LoginResult(response, refreshToken);
    }
}
