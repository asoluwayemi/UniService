package com.uniservice.staff.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddQualificationRequest {

    @NotBlank
    private String degree;

    private String fieldOfStudy;

    @NotBlank
    private String institution;

    private Integer yearObtained;
}
