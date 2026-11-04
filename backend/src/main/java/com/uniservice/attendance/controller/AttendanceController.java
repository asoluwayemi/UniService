package com.uniservice.attendance.controller;

import com.uniservice.attendance.dto.AttendanceRecordResponse;
import com.uniservice.attendance.dto.AttendanceSummaryResponse;
import com.uniservice.attendance.service.AttendanceService;
import com.uniservice.auth.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService service;

    @PostMapping("/clock-in")
    public AttendanceRecordResponse clockIn(@AuthenticationPrincipal UserPrincipal p) {
        return service.clockIn(p.getUser());
    }

    @PostMapping("/clock-out")
    public AttendanceRecordResponse clockOut(@AuthenticationPrincipal UserPrincipal p) {
        return service.clockOut(p.getUser());
    }

    @GetMapping("/today")
    public AttendanceRecordResponse today(@AuthenticationPrincipal UserPrincipal p) {
        return service.today(p.getUser());
    }

    @GetMapping("/me")
    public AttendanceSummaryResponse mine(
            @AuthenticationPrincipal UserPrincipal p,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return service.monthSummary(p.getUser(), month != null ? month : YearMonth.now());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ATTENDANCE_VIEW_ALL')")
    public List<AttendanceRecordResponse> byDate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.forDate(date != null ? date : LocalDate.now());
    }
}
