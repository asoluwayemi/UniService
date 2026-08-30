package com.uniservice.promotion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SchedulePromotionExamRequest {
    @NotNull
    private LocalDate examDate;
    private String comment;
}
