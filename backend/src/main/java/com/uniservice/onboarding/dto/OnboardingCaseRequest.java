package com.uniservice.onboarding.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record OnboardingCaseRequest(
        @NotBlank @Size(max = 200) String newHireName,
        @NotBlank @Email String email,
        @NotBlank @Size(max = 200) String position,
        @NotBlank @Size(max = 200) String department,
        @NotNull LocalDate startDate) {
}
