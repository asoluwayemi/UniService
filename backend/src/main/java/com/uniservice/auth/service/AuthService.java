package com.uniservice.auth.service;

import com.uniservice.auth.dto.LoginRequest;
import com.uniservice.auth.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
}
