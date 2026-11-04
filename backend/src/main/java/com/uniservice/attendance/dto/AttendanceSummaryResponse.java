package com.uniservice.attendance.dto;

import java.util.List;

public record AttendanceSummaryResponse(
        String month, int daysPresent, int daysLate, long totalMinutesWorked, List<AttendanceRecordResponse> records) {
}
