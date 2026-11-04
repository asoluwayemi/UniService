package com.uniservice.onboarding.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record FromApplicationRequest(@NotNull LocalDate startDate) {
}
