package com.uniservice.appraisal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAppraisalCycleRequest {

    @NotNull
    private Integer year;
}
