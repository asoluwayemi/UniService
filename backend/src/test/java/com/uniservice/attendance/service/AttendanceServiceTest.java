package com.uniservice.attendance.service;

import com.uniservice.attendance.dto.AttendanceRecordResponse;
import com.uniservice.attendance.dto.AttendanceSummaryResponse;
import com.uniservice.attendance.entity.AttendanceRecord;
import com.uniservice.attendance.repository.AttendanceRecordRepository;
import com.uniservice.auth.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Africa/Lagos");
    private static final LocalDate DAY = LocalDate.of(2027, 3, 10);

    @Mock private AttendanceRecordRepository repository;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("jdoe");
        user.setFirstName("Jane");
        user.setLastName("Doe");
    }

    private AttendanceService serviceAt(LocalTime time) {
        Clock clock = Clock.fixed(DAY.atTime(time).atZone(ZONE).toInstant(), ZONE);
        return new AttendanceService(repository, clock);
    }

    private AttendanceRecord record(Instant in, Instant out, boolean late) {
        return AttendanceRecord.builder().user(user).workDate(DAY).clockIn(in).clockOut(out).late(late).build();
    }

    @Test
    void clockIn_beforeNine_isOnTime() {
        when(repository.findByUserAndWorkDate(user, DAY)).thenReturn(Optional.empty());
        when(repository.save(any(AttendanceRecord.class))).thenAnswer(i -> i.getArgument(0));

        AttendanceRecordResponse r = serviceAt(LocalTime.of(8, 30)).clockIn(user);

        assertThat(r.late()).isFalse();
        assertThat(r.workDate()).isEqualTo(DAY);
        assertThat(r.fullName()).isEqualTo("Jane Doe");
        assertThat(r.clockOut()).isNull();
    }

    @Test
    void clockIn_afterNine_isLate() {
        when(repository.findByUserAndWorkDate(user, DAY)).thenReturn(Optional.empty());
        when(repository.save(any(AttendanceRecord.class))).thenAnswer(i -> i.getArgument(0));

        assertThat(serviceAt(LocalTime.of(9, 15)).clockIn(user).late()).isTrue();
    }

    @Test
    void clockIn_twiceInADay_isRejected() {
        when(repository.findByUserAndWorkDate(user, DAY)).thenReturn(Optional.of(record(Instant.now(), null, false)));

        assertThatThrownBy(() -> serviceAt(LocalTime.of(10, 0)).clockIn(user))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("already clocked in");
        verify(repository, never()).save(any());
    }

    @Test
    void clockOut_setsTimeAndComputesMinutes() {
        Instant in = DAY.atTime(8, 0).atZone(ZONE).toInstant();
        when(repository.findByUserAndWorkDate(user, DAY)).thenReturn(Optional.of(record(in, null, false)));
        when(repository.save(any(AttendanceRecord.class))).thenAnswer(i -> i.getArgument(0));

        AttendanceRecordResponse r = serviceAt(LocalTime.of(16, 30)).clockOut(user);

        assertThat(r.clockOut()).isNotNull();
        assertThat(r.minutesWorked()).isEqualTo(510);
    }

    @Test
    void clockOut_withoutClockIn_isRejected() {
        when(repository.findByUserAndWorkDate(user, DAY)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> serviceAt(LocalTime.of(16, 0)).clockOut(user))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("not clocked in");
    }

    @Test
    void clockOut_twice_isRejected() {
        Instant t = DAY.atTime(8, 0).atZone(ZONE).toInstant();
        when(repository.findByUserAndWorkDate(user, DAY)).thenReturn(Optional.of(record(t, t.plusSeconds(3600), false)));

        assertThatThrownBy(() -> serviceAt(LocalTime.of(17, 0)).clockOut(user))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("already clocked out");
    }

    @Test
    void today_returnsNullWhenNotClockedIn() {
        when(repository.findByUserAndWorkDate(user, DAY)).thenReturn(Optional.empty());
        assertThat(serviceAt(LocalTime.of(8, 0)).today(user)).isNull();
    }

    @Test
    void monthSummary_aggregatesPresentLateAndMinutes() {
        Instant a = DAY.atTime(8, 0).atZone(ZONE).toInstant();
        Instant b = DAY.minusDays(1).atTime(9, 30).atZone(ZONE).toInstant();
        when(repository.findByUserAndWorkDateBetweenOrderByWorkDateDesc(
                user, LocalDate.of(2027, 3, 1), LocalDate.of(2027, 3, 31)))
                .thenReturn(List.of(record(a, a.plusSeconds(8 * 3600), false), record(b, b.plusSeconds(4 * 3600), true),
                        record(a, null, false)));

        AttendanceSummaryResponse s = serviceAt(LocalTime.of(8, 0)).monthSummary(user, YearMonth.of(2027, 3));

        assertThat(s.month()).isEqualTo("2027-03");
        assertThat(s.daysPresent()).isEqualTo(3);
        assertThat(s.daysLate()).isEqualTo(1);
        assertThat(s.totalMinutesWorked()).isEqualTo(12 * 60);
    }

    @Test
    void forDate_mapsRecords() {
        Instant a = DAY.atTime(8, 0).atZone(ZONE).toInstant();
        when(repository.findByWorkDateOrderByClockInAsc(DAY)).thenReturn(List.of(record(a, null, false)));

        assertThat(serviceAt(LocalTime.of(8, 0)).forDate(DAY)).hasSize(1);
    }
}
