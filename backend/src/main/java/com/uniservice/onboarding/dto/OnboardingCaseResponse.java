package com.uniservice.onboarding.dto;

import com.uniservice.onboarding.entity.OnboardingCase;
import com.uniservice.onboarding.entity.OnboardingStatus;

import java.time.LocalDate;
import java.util.List;

/**
 * @param linkedUsername the staff account linked to this case, or null
 * @param profileReady   the linked account has a staff profile
 * @param payrollReady   the profile has a grade level, so payroll can pay them
 */
public record OnboardingCaseResponse(Long id, String newHireName, String email, String position, String department,
                                     LocalDate startDate, OnboardingStatus status, Long applicationId,
                                     String linkedUsername, boolean profileReady, boolean payrollReady,
                                     int tasksDone, int tasksTotal, List<OnboardingTaskResponse> tasks) {
    public static OnboardingCaseResponse from(OnboardingCase c, List<OnboardingTaskResponse> tasks,
                                              boolean profileReady, boolean payrollReady) {
        return new OnboardingCaseResponse(c.getId(), c.getNewHireName(), c.getEmail(), c.getPosition(), c.getDepartment(),
                c.getStartDate(), c.getStatus(), c.getApplication() == null ? null : c.getApplication().getId(),
                c.getUser() == null ? null : c.getUser().getUsername(), profileReady, payrollReady,
                (int) tasks.stream().filter(OnboardingTaskResponse::done).count(), tasks.size(), tasks);
    }
}
