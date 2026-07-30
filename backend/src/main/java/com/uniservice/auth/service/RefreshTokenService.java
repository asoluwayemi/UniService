package com.uniservice.auth.service;

import com.uniservice.auth.config.JwtProperties;
import com.uniservice.auth.entity.*;
import com.uniservice.auth.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final JwtProperties jwtProperties;

    public RefreshToken create(User user){
        RefreshToken token=RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(Instant.now().plusSeconds(jwtProperties.getRefreshExpirationDays() * 86400))
                .revoked(false)
                .build();
        return repository.save(token);
    }

    public void revokeAll(User user){
        repository.findByUserAndRevokedFalse(user).forEach(t->{
            t.setRevoked(true);
            repository.save(t);
        });
    }

    public void revokeToken(String rawToken){
        repository.findByToken(rawToken).ifPresent(t -> {
            t.setRevoked(true);
            repository.save(t);
        });
    }

    /**
     * Validates the presented refresh token and issues a fresh one, revoking the old one
     * (rotation prevents a stolen refresh token from being replayed after the legitimate client refreshes).
     */
    public RefreshToken rotate(String rawToken){
        RefreshToken existing = repository.findByToken(rawToken)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (existing.isRevoked() || existing.getExpiresAt().isBefore(Instant.now())) {
            throw new BadCredentialsException("Refresh token expired or revoked");
        }

        existing.setRevoked(true);
        repository.save(existing);

        return create(existing.getUser());
    }
}
