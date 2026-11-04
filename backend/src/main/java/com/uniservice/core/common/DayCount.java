package com.uniservice.core.common;

import java.time.LocalDate;

/** Projection for per-day attendance counts. {@code getLate} is null-safe via the service. */
public interface DayCount {
    LocalDate getDay();

    long getTotal();

    Long getLate();
}
