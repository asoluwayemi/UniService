package com.uniservice.devops.dto;

import com.uniservice.devops.entity.DeploymentRun;
import com.uniservice.devops.entity.DeploymentRunStatus;
import com.uniservice.devops.entity.DeploymentRunType;

import java.time.Instant;

public record DeploymentRunResponse(
        Long id,
        DeploymentRunType runType,
        DeploymentRunStatus status,
        String triggeredByUsername,
        String output,
        Instant startedAt,
        Instant finishedAt) {
    public static DeploymentRunResponse from(DeploymentRun run) {
        return new DeploymentRunResponse(
                run.getId(),
                run.getRunType(),
                run.getStatus(),
                run.getTriggeredBy().getUsername(),
                run.getOutput(),
                run.getStartedAt(),
                run.getFinishedAt());
    }
}
