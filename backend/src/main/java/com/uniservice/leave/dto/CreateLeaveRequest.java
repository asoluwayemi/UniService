package com.uniservice.leave.dto;

import com.uniservice.leave.entity.LeaveType;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record CreateLeaveRequest(
        @NotNull LeaveType leaveType,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotBlank @Size(max = 1000) String reason,
        Long handoverOfficerId,
        String handoverNotes,
        Boolean requestAllowance) {}
