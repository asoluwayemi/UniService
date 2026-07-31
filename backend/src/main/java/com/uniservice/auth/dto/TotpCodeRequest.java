package com.uniservice.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TotpCodeRequest {
    @NotBlank
    private String code;
}
