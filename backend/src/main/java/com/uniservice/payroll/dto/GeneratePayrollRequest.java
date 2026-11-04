package com.uniservice.payroll.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record GeneratePayrollRequest(
        @NotBlank @Pattern(regexp = "\\d{4}-(0[1-9]|1[0-2])", message = "period must be yyyy-MM") String period) {
}
