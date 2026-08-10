package com.uniservice.nonacademic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateProjectRequest {
    @NotBlank(message = "Project title is required")
    private String projectTitle;

    @NotBlank(message = "Role is required")
    private String role;

    private String description;
    private String status;
}
