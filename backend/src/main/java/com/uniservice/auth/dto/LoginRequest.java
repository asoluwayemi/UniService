package com.uniservice.auth.dto;

public record LoginRequest(
    String username,
    String password
){}
