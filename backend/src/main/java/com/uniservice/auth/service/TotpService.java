package com.uniservice.auth.service;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.stereotype.Service;

import java.util.Base64;

/** Low-level TOTP primitives: secret generation, QR/URI provisioning, code verification. */
@Service
public class TotpService {

    private static final String ISSUER = "UniService";

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final CodeVerifier codeVerifier =
            new DefaultCodeVerifier(new DefaultCodeGenerator(), new SystemTimeProvider());

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public String buildOtpAuthUri(String username, String secret) {
        return qrData(username, secret).getUri();
    }

    public String generateQrCodeDataUri(String username, String secret) {
        try {
            byte[] imageBytes = qrGenerator.generate(qrData(username, secret));
            return "data:" + qrGenerator.getImageMimeType() + ";base64," + Base64.getEncoder().encodeToString(imageBytes);
        } catch (QrGenerationException e) {
            throw new IllegalStateException("Could not generate TOTP QR code", e);
        }
    }

    public boolean verifyCode(String secret, String code) {
        return code != null && codeVerifier.isValidCode(secret, code);
    }

    private QrData qrData(String username, String secret) {
        return new QrData.Builder()
                .label(username)
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
    }
}
