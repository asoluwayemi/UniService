package com.uniservice.nonacademic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTrainingRequest {
    @NotBlank(message = "Training title is required")
    private String title;

    @NotBlank(message = "Organizer is required")
    private String organizer;

    @NotNull(message = "Year attended is required")
    private Integer yearAttended;

    private String certificateNumber;
    private String certificateUrl;
}
