package com.uniservice.auth.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
public class LoginResponse {
 private String accessToken;
 private String tokenType;
 private String username;
}
