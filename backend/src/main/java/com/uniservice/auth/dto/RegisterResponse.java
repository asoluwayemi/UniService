package com.uniservice.auth.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
public class RegisterResponse{
 private Long id;
 private String username;
 private String email;
 private String message;
}
