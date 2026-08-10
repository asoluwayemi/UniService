package com.uniservice.academic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSupervisionRequest {
    @NotBlank(message = "Student name is required")
    private String studentName;

    @NotBlank(message = "Matric number is required")
    private String matricNumber;

    @NotBlank(message = "Programme is required")
    private String programme;

    @NotBlank(message = "Research topic is required")
    private String researchTopic;

    @NotBlank(message = "Stage is required")
    private String stage;
}
