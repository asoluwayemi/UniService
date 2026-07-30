package com.uniservice.auth.service;

import com.uniservice.auth.config.JwtProperties;
import com.uniservice.auth.entity.RefreshToken;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock private RefreshTokenRepository repository;

    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setRefreshExpirationDays(7);
        refreshTokenService = new RefreshTokenService(repository, properties);
    }

    @Test
    void create_savesTokenWithFutureExpiry() {
        User user = new User();
        when(repository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken token = refreshTokenService.create(user);

        assertThat(token.getUser()).isEqualTo(user);
        assertThat(token.isRevoked()).isFalse();
        assertThat(token.getExpiresAt()).isAfter(Instant.now());
        assertThat(token.getToken()).isNotBlank();
    }

    @Test
    void revokeAll_marksAllActiveTokensRevoked() {
        User user = new User();
        RefreshToken t1 = RefreshToken.builder().token("t1").user(user).revoked(false).build();
        RefreshToken t2 = RefreshToken.builder().token("t2").user(user).revoked(false).build();
        when(repository.findByUserAndRevokedFalse(user)).thenReturn(List.of(t1, t2));

        refreshTokenService.revokeAll(user);

        assertThat(t1.isRevoked()).isTrue();
        assertThat(t2.isRevoked()).isTrue();
        verify(repository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    void rotate_revokesOldAndIssuesNew_whenValid() {
        User user = new User();
        RefreshToken existing = RefreshToken.builder()
                .token("old-token")
                .user(user)
                .expiresAt(Instant.now().plusSeconds(60))
                .revoked(false)
                .build();

        when(repository.findByToken("old-token")).thenReturn(Optional.of(existing));
        when(repository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken rotated = refreshTokenService.rotate("old-token");

        assertThat(existing.isRevoked()).isTrue();
        assertThat(rotated.getToken()).isNotEqualTo("old-token");
        assertThat(rotated.getUser()).isEqualTo(user);
    }

    @Test
    void rotate_throws_whenTokenNotFound() {
        when(repository.findByToken("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.rotate("missing"))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void rotate_throws_whenTokenRevoked() {
        User user = new User();
        RefreshToken revoked = RefreshToken.builder()
                .token("revoked-token")
                .user(user)
                .expiresAt(Instant.now().plusSeconds(60))
                .revoked(true)
                .build();

        when(repository.findByToken("revoked-token")).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> refreshTokenService.rotate("revoked-token"))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void rotate_throws_whenTokenExpired() {
        User user = new User();
        RefreshToken expired = RefreshToken.builder()
                .token("expired-token")
                .user(user)
                .expiresAt(Instant.now().minusSeconds(10))
                .revoked(false)
                .build();

        when(repository.findByToken("expired-token")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> refreshTokenService.rotate("expired-token"))
                .isInstanceOf(BadCredentialsException.class);
    }
}
