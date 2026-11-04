package com.uniservice.attendance.dto;

import com.uniservice.attendance.entity.AttendanceRecord;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

public record AttendanceRecordResponse(
        Long id, String username, String fullName, LocalDate workDate,
        Instant clockIn, Instant clockOut, boolean late, Long minutesWorked) {

    public static AttendanceRecordResponse from(AttendanceRecord r) {
        Long minutes = r.getClockOut() == null ? null : Duration.between(r.getClockIn(), r.getClockOut()).toMinutes();
        String fullName = ((r.getUser().getFirstName() == null ? "" : r.getUser().getFirstName()) + " "
                + (r.getUser().getLastName() == null ? "" : r.getUser().getLastName())).trim();
        return new AttendanceRecordResponse(r.getId(), r.getUser().getUsername(), fullName, r.getWorkDate(),
                r.getClockIn(), r.getClockOut(), r.isLate(), minutes);
    }
}
