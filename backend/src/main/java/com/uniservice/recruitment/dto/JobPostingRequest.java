package com.uniservice.recruitment.dto;

import com.uniservice.recruitment.entity.PostingCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record JobPostingRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 200) String department,
        @NotNull PostingCategory category,
        @NotBlank @Size(max = 4000) String description,
        LocalDate closingDate) {
}
