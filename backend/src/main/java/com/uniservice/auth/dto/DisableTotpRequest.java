package com.uniservice.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DisableTotpRequest {
    @NotBlank
    private String password;
}
