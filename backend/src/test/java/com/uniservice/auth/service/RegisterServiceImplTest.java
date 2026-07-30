package com.uniservice.auth.service;

import com.uniservice.auth.dto.RegisterRequest;
import com.uniservice.auth.dto.RegisterResponse;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegisterServiceImplTest {

    @Mock private UserRepository repository;
    @Mock private PasswordEncoder encoder;

    private RegisterServiceImpl registerService;

    @BeforeEach
    void setUp() {
        registerService = new RegisterServiceImpl(repository, encoder);
    }

    @Test
    void register_persistsAllFieldsIncludingNames() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("jdoe");
        request.setEmail("jdoe@example.com");
        request.setPassword("password123");
        request.setFirstName("Jane");
        request.setLastName("Doe");

        when(encoder.encode("password123")).thenReturn("hashed-password");
        when(repository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        RegisterResponse response = registerService.register(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(repository).save(captor.capture());
        User saved = captor.getValue();

        assertThat(saved.getUsername()).isEqualTo("jdoe");
        assertThat(saved.getEmail()).isEqualTo("jdoe@example.com");
        assertThat(saved.getFirstName()).isEqualTo("Jane");
        assertThat(saved.getLastName()).isEqualTo("Doe");
        assertThat(saved.getPasswordHash()).isEqualTo("hashed-password");
        assertThat(saved.isEnabled()).isTrue();

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getUsername()).isEqualTo("jdoe");
        assertThat(response.getEmail()).isEqualTo("jdoe@example.com");
    }
}
