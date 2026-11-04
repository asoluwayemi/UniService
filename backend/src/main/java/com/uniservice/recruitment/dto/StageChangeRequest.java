package com.uniservice.recruitment.dto;

import com.uniservice.recruitment.entity.ApplicationStage;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StageChangeRequest(@NotNull ApplicationStage stage, @Size(max = 1000) String note) {
}
