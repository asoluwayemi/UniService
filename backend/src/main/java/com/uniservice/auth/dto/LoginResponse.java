package com.uniservice.auth.dto;

public record LoginResponse(
    String accessToken,
    String refreshToken
){}
