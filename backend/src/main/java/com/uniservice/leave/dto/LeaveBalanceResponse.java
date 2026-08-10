package com.uniservice.leave.dto;

public record LeaveBalanceResponse(
        int gradeLevel,
        int annualEntitlementDays,
        int usedDaysThisYear,
        int remainingDaysThisYear) {}
