package com.uniservice.hr.service;

import com.uniservice.auth.config.TotpProperties;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.auth.service.TotpSecretCipher;
import com.uniservice.auth.service.TotpService;
import com.uniservice.hr.dto.HrStepUpResponse;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class HrStepUpServiceTest {

    @Mock private UserRepository userRepository;

    private TotpService totpService;
    private TotpSecretCipher secretCipher;
    private HrStepUpService service;

    private User user;
    private String plainSecret;

    @BeforeEach
    void setUp() {
        totpService = new TotpService();
        TotpProperties props = new TotpProperties();
        props.setSecretEncryptionKey("wbeCgTAVyScMpxbvMdpcuxZVLM+tBGLW3BLLKlcSFjs=");
        secretCipher = new TotpSecretCipher(props);
        service = new HrStepUpService(totpService, secretCipher, userRepository);

        plainSecret = totpService.generateSecret();
        user = new User();
        user.setId(1L);
        user.setUsername("hrhead");
        user.setTotpEnabled(true);
        user.setTotpSecret(secretCipher.encrypt(plainSecret));
    }

    private String currentValidCode() throws Exception {
        return new DefaultCodeGenerator(HashingAlgorithm.SHA1)
                .generate(plainSecret, new SystemTimeProvider().getTime() / 30);
    }

    @Test
    void verify_totpNotEnrolled_throws() {
        user.setTotpEnabled(false);

        assertThatThrownBy(() -> service.verify(user, "123456"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not enrolled");
    }

    @Test
    void verify_wrongCode_throws() {
        assertThatThrownBy(() -> service.verify(user, "000000"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid code");
    }

    @Test
    void verify_correctCode_setsStepUpExpiryAboutFifteenMinutesOut() throws Exception {
        HrStepUpResponse response = service.verify(user, currentValidCode());

        assertThat(response.hrStepUpExpiresAt()).isAfter(Instant.now().plusSeconds(14 * 60));
        assertThat(response.hrStepUpExpiresAt()).isBefore(Instant.now().plusSeconds(16 * 60));
        assertThat(user.getHrStepUpExpiresAt()).isEqualTo(response.hrStepUpExpiresAt());
        verify(userRepository).save(user);
    }

    @Test
    void exit_clearsStepUpElevation() {
        user.setHrStepUpExpiresAt(Instant.now().plusSeconds(600));

        service.exit(user);

        assertThat(user.getHrStepUpExpiresAt()).isNull();
        verify(userRepository).save(user);
    }
}
