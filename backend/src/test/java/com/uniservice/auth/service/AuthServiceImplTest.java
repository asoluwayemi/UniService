package com.uniservice.auth.service;

import com.uniservice.auth.dto.LoginRequest;
import com.uniservice.auth.entity.RefreshToken;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.Instant;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserRepository userRepository;
    @Mock private JwtService jwtService;
    @Mock private RefreshTokenService refreshTokenService;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(authenticationManager, userRepository, jwtService, refreshTokenService);
    }

    @Test
    void login_returnsAccessTokenAndRefreshToken_onSuccess() {
        LoginRequest request = new LoginRequest();
        request.setUsername("jdoe");
        request.setPassword("password123");

        User user = new User();
        user.setUsername("jdoe");

        RefreshToken refreshToken = RefreshToken.builder()
                .token("refresh-token-value")
                .user(user)
                .expiresAt(Instant.now().plusSeconds(60))
                .revoked(false)
                .build();

        when(userRepository.findByUsernameOrEmail("jdoe", "jdoe")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("access-token-value");
        when(refreshTokenService.create(user)).thenReturn(refreshToken);

        LoginResult result = authService.login(request);

        assertThat(result.response().getAccessToken()).isEqualTo("access-token-value");
        assertThat(result.response().getUsername()).isEqualTo("jdoe");
        assertThat(result.refreshToken().getToken()).isEqualTo("refresh-token-value");

        verify(authenticationManager).authenticate(any());
        verify(refreshTokenService).revokeAll(user);
    }

    @Test
    void login_propagatesBadCredentials_whenAuthenticationFails() {
        LoginRequest request = new LoginRequest();
        request.setUsername("jdoe");
        request.setPassword("wrong");

        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);

        verifyNoInteractions(refreshTokenService);
    }

    @Test
    void login_throws_whenUserDisappearsAfterAuthentication() {
        LoginRequest request = new LoginRequest();
        request.setUsername("jdoe");
        request.setPassword("password123");

        when(userRepository.findByUsernameOrEmail("jdoe", "jdoe")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(NoSuchElementException.class);
    }
}
