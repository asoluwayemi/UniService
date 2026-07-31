package com.uniservice.auth.service;

import com.uniservice.auth.dto.TotpSetupResponse;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TotpEnrollmentServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private TotpService totpService;
    private TotpSecretCipher secretCipher;
    private TotpEnrollmentService service;

    private User user;

    @BeforeEach
    void setUp() {
        totpService = new TotpService();
        secretCipher = new TotpSecretCipher(fixedTestKeyProperties());
        service = new TotpEnrollmentService(totpService, secretCipher, userRepository, passwordEncoder);

        user = new User();
        user.setId(1L);
        user.setUsername("jdoe");
        user.setPasswordHash("hashed-password");
    }

    private com.uniservice.auth.config.TotpProperties fixedTestKeyProperties() {
        com.uniservice.auth.config.TotpProperties props = new com.uniservice.auth.config.TotpProperties();
        props.setSecretEncryptionKey("wbeCgTAVyScMpxbvMdpcuxZVLM+tBGLW3BLLKlcSFjs=");
        return props;
    }

    @Test
    void beginEnrollment_generatesAndPersistsEncryptedPendingSecret() {
        TotpSetupResponse response = service.beginEnrollment(user);

        assertThat(response.secret()).isNotBlank();
        assertThat(response.otpAuthUri()).contains("jdoe");
        assertThat(response.qrCodeDataUri()).startsWith("data:image/png;base64,");
        assertThat(user.isTotpEnabled()).isFalse();
        assertThat(user.getTotpSecret()).isNotEqualTo(response.secret());
        verify(userRepository).save(user);
    }

    @Test
    void beginEnrollment_calledTwiceWhilePending_returnsSameSecretWithoutOverwriting() {
        // Regression test: a duplicate call (e.g. React StrictMode double-invoking the
        // enrollment page's effect) must not silently mint a second secret that invalidates
        // whatever the user is already looking at on screen.
        TotpSetupResponse first = service.beginEnrollment(user);
        String persistedAfterFirst = user.getTotpSecret();

        TotpSetupResponse second = service.beginEnrollment(user);

        assertThat(second.secret()).isEqualTo(first.secret());
        assertThat(user.getTotpSecret()).isEqualTo(persistedAfterFirst);
    }

    @Test
    void beginEnrollment_alreadyEnabled_throwsWithoutTouchingExistingSecret() {
        // Regression test for a real bug: an earlier version of beginEnrollment treated
        // "already enabled" the same as "no secret yet" and silently regenerated a fresh
        // pending secret AND flipped totpEnabled back to false -- effectively downgrading an
        // account's 2FA with nothing more than a stray call to this endpoint (e.g. a stale
        // frontend redirect or a bookmarked URL hit after enrollment was already confirmed).
        service.beginEnrollment(user);
        String secretBeforeConfirm = user.getTotpSecret();
        user.setTotpEnabled(true);

        assertThatThrownBy(() -> service.beginEnrollment(user))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already enabled");

        assertThat(user.isTotpEnabled()).isTrue();
        assertThat(user.getTotpSecret()).isEqualTo(secretBeforeConfirm);
    }

    @Test
    void confirmEnrollment_withoutPriorSetup_throws() {
        assertThatThrownBy(() -> service.confirmEnrollment(user, "123456"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start TOTP enrollment first");
    }

    @Test
    void confirmEnrollment_correctCode_enablesTotp() throws Exception {
        service.beginEnrollment(user);
        String secret = secretCipher.decrypt(user.getTotpSecret());
        String code = new DefaultCodeGenerator(HashingAlgorithm.SHA1)
                .generate(secret, new SystemTimeProvider().getTime() / 30);

        service.confirmEnrollment(user, code);

        assertThat(user.isTotpEnabled()).isTrue();
        assertThat(user.getTotpEnrolledAt()).isNotNull();
    }

    @Test
    void confirmEnrollment_wrongCode_throwsAndLeavesDisabled() {
        service.beginEnrollment(user);

        assertThatThrownBy(() -> service.confirmEnrollment(user, "000000"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid code");
        assertThat(user.isTotpEnabled()).isFalse();
    }

    @Test
    void disable_wrongPassword_throws() {
        when(passwordEncoder.matches("wrong", "hashed-password")).thenReturn(false);

        assertThatThrownBy(() -> service.disable(user, "wrong"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid current password");
    }

    @Test
    void disable_correctPassword_clearsTotpState() {
        service.beginEnrollment(user);
        when(passwordEncoder.matches("correct", "hashed-password")).thenReturn(true);

        service.disable(user, "correct");

        assertThat(user.getTotpSecret()).isNull();
        assertThat(user.isTotpEnabled()).isFalse();
        assertThat(user.getTotpEnrolledAt()).isNull();
    }
}
