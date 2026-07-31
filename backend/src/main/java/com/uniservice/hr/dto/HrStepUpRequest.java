package com.uniservice.hr.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HrStepUpRequest {
    @NotBlank
    private String code;
}
