package com.uniservice.appraisal.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class SickLeaveEntryRequest {

    private LocalDate fromDate;
    private LocalDate toDate;
    private Integer numberOfDays;
}
