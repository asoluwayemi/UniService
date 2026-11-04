package com.uniservice.recruitment.dto;

import com.uniservice.recruitment.entity.PostingStatus;
import jakarta.validation.constraints.NotNull;

public record PostingStatusRequest(@NotNull PostingStatus status) {
}
