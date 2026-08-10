package com.uniservice.leave.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record SubmitResumptionRequest(
        @NotNull LocalDate resumptionDate,
        @Size(max = 1000) String resumptionNotes) {}
