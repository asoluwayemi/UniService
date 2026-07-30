package com.uniservice.auth.service;

import com.uniservice.auth.config.JwtProperties;
import com.uniservice.auth.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "test-secret-key-that-is-at-least-32-characters-long";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret(SECRET);
        properties.setExpiration(60_000);
        jwtService = new JwtService(properties);
    }

    @Test
    void generateToken_thenExtractUsername_roundTrips() {
        User user = new User();
        user.setUsername("jdoe");

        String token = jwtService.generateToken(user);

        assertThat(jwtService.isTokenValid(token)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo("jdoe");
    }

    @Test
    void isTokenValid_returnsFalse_forMalformedToken() {
        assertThat(jwtService.isTokenValid("not-a-jwt")).isFalse();
    }

    @Test
    void isTokenValid_returnsFalse_forExpiredToken() throws InterruptedException {
        JwtProperties shortLived = new JwtProperties();
        shortLived.setSecret(SECRET);
        shortLived.setExpiration(1);
        JwtService shortLivedService = new JwtService(shortLived);

        User user = new User();
        user.setUsername("jdoe");
        String token = shortLivedService.generateToken(user);

        Thread.sleep(15);

        assertThat(shortLivedService.isTokenValid(token)).isFalse();
    }
}
