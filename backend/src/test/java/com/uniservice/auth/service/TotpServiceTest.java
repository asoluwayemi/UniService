package com.uniservice.auth.service;

import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TotpServiceTest {

    private final TotpService service = new TotpService();

    @Test
    void generateSecret_producesNonBlankBase32Secret() {
        String secret = service.generateSecret();

        assertThat(secret).isNotBlank();
        assertThat(secret).matches("[A-Z2-7]+");
    }

    @Test
    void buildOtpAuthUri_containsIssuerAndUsername() {
        String uri = service.buildOtpAuthUri("jdoe", "JBSWY3DPEHPK3PXP");

        assertThat(uri).startsWith("otpauth://totp/");
        assertThat(uri).contains("UniService");
        assertThat(uri).contains("jdoe");
    }

    @Test
    void generateQrCodeDataUri_producesPngDataUri() {
        String dataUri = service.generateQrCodeDataUri("jdoe", "JBSWY3DPEHPK3PXP");

        assertThat(dataUri).startsWith("data:image/png;base64,");
    }

    @Test
    void verifyCode_acceptsCorrectlyGeneratedCode() throws Exception {
        String secret = "JBSWY3DPEHPK3PXP";
        String currentCode = new DefaultCodeGenerator(HashingAlgorithm.SHA1)
                .generate(secret, new SystemTimeProvider().getTime() / 30);

        assertThat(service.verifyCode(secret, currentCode)).isTrue();
    }

    @Test
    void verifyCode_rejectsWrongCode() {
        assertThat(service.verifyCode("JBSWY3DPEHPK3PXP", "000000")).isFalse();
    }

    @Test
    void verifyCode_rejectsNullCode() {
        assertThat(service.verifyCode("JBSWY3DPEHPK3PXP", null)).isFalse();
    }
}
