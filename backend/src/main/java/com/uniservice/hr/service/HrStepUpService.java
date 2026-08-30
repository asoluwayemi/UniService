package com.uniservice.hr.service;

import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.auth.service.TotpSecretCipher;
import com.uniservice.auth.service.TotpService;
import com.uniservice.hr.dto.HrStepUpResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Step-up state for the HR Portal is a plain DB timestamp on User rather than a second
 * signed token: JwtAuthenticationFilter reloads the full User fresh from the DB on
 * every request.
 */
@Service
@RequiredArgsConstructor
public class HrStepUpService {

    private static final Duration STEP_UP_TTL = Duration.ofMinutes(15);

    private final TotpService totpService;
    private final TotpSecretCipher secretCipher;
    private final UserRepository userRepository;

    @Transactional
    public HrStepUpResponse verify(User user, String code) {
        if (!user.isTotpEnabled() || user.getTotpSecret() == null) {
            throw new IllegalArgumentException("TOTP is not enrolled for this account");
        }

        String secret = secretCipher.decrypt(user.getTotpSecret());
        if (!totpService.verifyCode(secret, code)) {
            throw new IllegalArgumentException("Invalid code");
        }
        user.setHrStepUpExpiresAt(Instant.now().plus(STEP_UP_TTL));
        userRepository.save(user);
        return new HrStepUpResponse(user.getHrStepUpExpiresAt());
    }

    /** Explicit "exit HR Portal" action: clears the elevation without ending the session. */
    @Transactional
    public void exit(User user) {
        user.setHrStepUpExpiresAt(null);
        userRepository.save(user);
    }
}
