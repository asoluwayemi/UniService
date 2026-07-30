package com.uniservice.auth.service;

import com.uniservice.auth.dto.LoginResponse;
import com.uniservice.auth.entity.RefreshToken;

public record LoginResult(LoginResponse response, RefreshToken refreshToken) {
}
