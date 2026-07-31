package com.uniservice.auth.service;

import com.uniservice.auth.dto.TotpSetupResponse;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class TotpEnrollmentService {

    private final TotpService totpService;
    private final TotpSecretCipher secretCipher;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Generates and persists a pending secret; totpEnabled stays false until confirmEnrollment.
     * Idempotent while a pending (unconfirmed) secret already exists — reuses it instead of
     * minting a new one, so a duplicate call (e.g. React StrictMode double-invoking the
     * enrollment page's effect) can't silently invalidate a secret the user is already
     * looking at on screen.
     *
     * Deliberately refuses to run at all once TOTP is already confirmed: an earlier version
     * of this method treated "already enabled" the same as "no secret yet" and would silently
     * regenerate a fresh pending secret AND flip totpEnabled back to false — effectively
     * downgrading an account's 2FA with nothing more than a stray call to this endpoint (e.g.
     * a stale frontend redirect, a bookmarked URL, or a replayed request). Disabling 2FA now
     * requires the explicit, password-verified disable() call below.
     */
    @Transactional
    public TotpSetupResponse beginEnrollment(User user) {
        if (user.isTotpEnabled()) {
            throw new IllegalArgumentException("TOTP is already enabled for this account. Disable it first to re-enroll.");
        }
        String secret;
        if (user.getTotpSecret() != null) {
            secret = secretCipher.decrypt(user.getTotpSecret());
        } else {
            secret = totpService.generateSecret();
            user.setTotpSecret(secretCipher.encrypt(secret));
            userRepository.save(user);
        }
        return new TotpSetupResponse(
                secret,
                totpService.buildOtpAuthUri(user.getUsername(), secret),
                totpService.generateQrCodeDataUri(user.getUsername(), secret));
    }

    @Transactional
    public void confirmEnrollment(User user, String code) {
        if (user.getTotpSecret() == null) {
            throw new IllegalArgumentException("Start TOTP enrollment first");
        }
        String secret = secretCipher.decrypt(user.getTotpSecret());
        if (!totpService.verifyCode(secret, code)) {
            throw new IllegalArgumentException("Invalid code");
        }
        user.setTotpEnabled(true);
        user.setTotpEnrolledAt(Instant.now());
        userRepository.save(user);
    }

    @Transactional
    public void disable(User user, String currentPassword) {
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid current password");
        }
        user.setTotpSecret(null);
        user.setTotpEnabled(false);
        user.setTotpEnrolledAt(null);
        user.setHrStepUpExpiresAt(null);
        userRepository.save(user);
    }
}
