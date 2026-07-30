package com.uniservice.auth.service;

import com.uniservice.auth.dto.PasswordChangeRequest;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PasswordServiceImpl implements PasswordService {

    private final UserRepository repository;
    private final PasswordEncoder encoder;

    @Override
    public void changePassword(String username, PasswordChangeRequest request) {
        User user = repository.findByUsername(username).orElseThrow();
        if (!encoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid current password");
        }
        user.setPasswordHash(encoder.encode(request.getNewPassword()));
        repository.save(user);
    }
}
