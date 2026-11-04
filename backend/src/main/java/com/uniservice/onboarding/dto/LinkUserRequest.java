package com.uniservice.onboarding.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LinkUserRequest(@NotBlank @Email String email) {
}
