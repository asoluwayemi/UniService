package com.uniservice.attendance.repository;

import com.uniservice.attendance.entity.AttendanceRecord;
import com.uniservice.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    Optional<AttendanceRecord> findByUserAndWorkDate(User user, LocalDate workDate);

    List<AttendanceRecord> findByUserAndWorkDateBetweenOrderByWorkDateDesc(User user, LocalDate from, LocalDate to);

    List<AttendanceRecord> findByWorkDateOrderByClockInAsc(LocalDate workDate);
}
