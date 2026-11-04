package com.uniservice.attendance.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import com.uniservice.core.common.DayCount;
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

    @Query("select a.workDate as day, count(a) as total, sum(case when a.late = true then 1 else 0 end) as late "
            + "from AttendanceRecord a where a.workDate between :from and :to group by a.workDate order by a.workDate")
    List<DayCount> countByDay(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
