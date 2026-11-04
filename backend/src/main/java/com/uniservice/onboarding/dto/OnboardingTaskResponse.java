package com.uniservice.onboarding.dto;

import com.uniservice.onboarding.entity.OnboardingTask;

import java.time.Instant;

public record OnboardingTaskResponse(Long id, String title, String ownerTeam, boolean done, Instant doneAt, String doneBy) {
    public static OnboardingTaskResponse from(OnboardingTask t) {
        return new OnboardingTaskResponse(t.getId(), t.getTitle(), t.getOwnerTeam(), t.isDone(), t.getDoneAt(), t.getDoneBy());
    }
}
