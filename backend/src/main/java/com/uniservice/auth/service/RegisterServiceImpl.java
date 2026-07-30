package com.uniservice.auth.service;

import com.uniservice.auth.dto.*;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RegisterServiceImpl implements RegisterService {

    private final UserRepository repository;
    private final PasswordEncoder encoder;

    @Override
    public RegisterResponse register(RegisterRequest request) {
        User user = createUser(request);
        repository.save(user);
        return RegisterResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .message("Registration successful")
                .build();
    }

    @Override
    public User createUser(RegisterRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPasswordHash(encoder.encode(request.getPassword()));
        user.setEnabled(true);
        return user;
    }
}
