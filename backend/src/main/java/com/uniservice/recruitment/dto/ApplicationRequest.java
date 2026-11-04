package com.uniservice.recruitment.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApplicationRequest(
        @NotBlank @Size(max = 200) String applicantName,
        @NotBlank @Email String email,
        @Size(max = 40) String phone,
        @Size(max = 2000) String coverNote) {
}
