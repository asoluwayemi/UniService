package com.uniservice.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Set;

@Data
public class CreateUserRequest {
    @NotBlank @Size(min = 3, max = 50)
    private String username;
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min = 8, max = 100)
    private String password;
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;
    @NotEmpty
    private Set<String> roleNames;
}
