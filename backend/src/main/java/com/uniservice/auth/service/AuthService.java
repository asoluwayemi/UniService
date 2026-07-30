package com.uniservice.auth.service;

import com.uniservice.auth.dto.LoginRequest;

public interface AuthService {
    LoginResult login(LoginRequest request);
}
