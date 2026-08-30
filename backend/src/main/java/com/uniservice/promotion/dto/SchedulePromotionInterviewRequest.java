package com.uniservice.promotion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SchedulePromotionInterviewRequest {
    @NotNull
    private LocalDate interviewDate;
    private String comment;
}
