package com.uniservice.auth.service;

import com.uniservice.auth.dto.RegisterRequest;
import com.uniservice.auth.dto.RegisterResponse;
import com.uniservice.auth.entity.User;

public interface RegisterService {
    RegisterResponse register(RegisterRequest request);
    User createUser(RegisterRequest request);
}
