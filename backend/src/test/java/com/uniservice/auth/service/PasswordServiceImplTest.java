package com.uniservice.auth.service;

import com.uniservice.auth.dto.PasswordChangeRequest;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordServiceImplTest {

    @Mock private UserRepository repository;
    @Mock private PasswordEncoder encoder;

    private PasswordServiceImpl passwordService;

    @BeforeEach
    void setUp() {
        passwordService = new PasswordServiceImpl(repository, encoder);
    }

    @Test
    void changePassword_updatesHash_whenCurrentPasswordMatches() {
        User user = new User();
        user.setUsername("jdoe");
        user.setPasswordHash("old-hash");

        PasswordChangeRequest request = new PasswordChangeRequest();
        request.setCurrentPassword("oldPass");
        request.setNewPassword("newPass");

        when(repository.findByUsername("jdoe")).thenReturn(Optional.of(user));
        when(encoder.matches("oldPass", "old-hash")).thenReturn(true);
        when(encoder.encode("newPass")).thenReturn("new-hash");

        passwordService.changePassword("jdoe", request);

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        verify(repository).save(user);
    }

    @Test
    void changePassword_throws_whenCurrentPasswordWrong() {
        User user = new User();
        user.setUsername("jdoe");
        user.setPasswordHash("old-hash");

        PasswordChangeRequest request = new PasswordChangeRequest();
        request.setCurrentPassword("wrongPass");
        request.setNewPassword("newPass");

        when(repository.findByUsername("jdoe")).thenReturn(Optional.of(user));
        when(encoder.matches("wrongPass", "old-hash")).thenReturn(false);

        assertThatThrownBy(() -> passwordService.changePassword("jdoe", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid current password");

        verify(repository, never()).save(any());
    }
}
