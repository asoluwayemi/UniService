package com.uniservice.staff.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AddEmploymentHistoryRequest {

    @NotBlank
    private String organization;

    @NotBlank
    private String positionTitle;

    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
}
