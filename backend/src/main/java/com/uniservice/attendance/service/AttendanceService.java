package com.uniservice.attendance.service;

import com.uniservice.attendance.dto.AttendanceRecordResponse;
import com.uniservice.attendance.dto.AttendanceSummaryResponse;
import com.uniservice.attendance.entity.AttendanceRecord;
import com.uniservice.attendance.repository.AttendanceRecordRepository;
import com.uniservice.auth.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;

@Service
public class AttendanceService {

    /** Clock-ins after this local time count as late. */
    static final LocalTime WORK_START = LocalTime.of(9, 0);

    private final AttendanceRecordRepository repository;
    private final Clock clock;

    public AttendanceService(AttendanceRecordRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public AttendanceRecordResponse clockIn(User user) {
        LocalDate today = LocalDate.now(clock);
        if (repository.findByUserAndWorkDate(user, today).isPresent()) {
            throw new IllegalArgumentException("You have already clocked in today");
        }
        Instant now = clock.instant();
        boolean late = LocalTime.now(clock).isAfter(WORK_START);
        AttendanceRecord saved = repository.save(AttendanceRecord.builder()
                .user(user).workDate(today).clockIn(now).late(late).build());
        return AttendanceRecordResponse.from(saved);
    }

    @Transactional
    public AttendanceRecordResponse clockOut(User user) {
        AttendanceRecord record = repository.findByUserAndWorkDate(user, LocalDate.now(clock))
                .orElseThrow(() -> new IllegalArgumentException("You have not clocked in today"));
        if (record.getClockOut() != null) {
            throw new IllegalArgumentException("You have already clocked out today");
        }
        record.setClockOut(clock.instant());
        return AttendanceRecordResponse.from(repository.save(record));
    }

    /** Today's record for the user, or null when they have not clocked in yet. */
    @Transactional(readOnly = true)
    public AttendanceRecordResponse today(User user) {
        return repository.findByUserAndWorkDate(user, LocalDate.now(clock))
                .map(AttendanceRecordResponse::from).orElse(null);
    }

    @Transactional(readOnly = true)
    public AttendanceSummaryResponse monthSummary(User user, YearMonth month) {
        List<AttendanceRecordResponse> records = repository
                .findByUserAndWorkDateBetweenOrderByWorkDateDesc(user, month.atDay(1), month.atEndOfMonth())
                .stream().map(AttendanceRecordResponse::from).toList();
        return new AttendanceSummaryResponse(
                month.toString(),
                records.size(),
                (int) records.stream().filter(AttendanceRecordResponse::late).count(),
                records.stream().mapToLong(r -> r.minutesWorked() == null ? 0 : r.minutesWorked()).sum(),
                records);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> forDate(LocalDate date) {
        return repository.findByWorkDateOrderByClockInAsc(date).stream().map(AttendanceRecordResponse::from).toList();
    }
}
