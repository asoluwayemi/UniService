package com.uniservice.devops.service;

import com.uniservice.auth.entity.User;
import com.uniservice.devops.dto.DeploymentRunResponse;
import com.uniservice.devops.entity.DeploymentRun;
import com.uniservice.devops.entity.DeploymentRunStatus;
import com.uniservice.devops.entity.DeploymentRunType;
import com.uniservice.devops.repository.DeploymentRunRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.concurrent.Executor;

@Service
public class DeploymentService {

    private static final Duration TIMEOUT = Duration.ofMinutes(10);

    private final DeploymentRunRepository runs;
    private final ProcessRunner processRunner;
    private final Executor deploymentExecutor;
    private final String repoRoot;
    private final String deployScript;

    public DeploymentService(
            DeploymentRunRepository runs,
            ProcessRunner processRunner,
            @Qualifier("deploymentExecutor") Executor deploymentExecutor,
            @Value("${app.devops.repo-root}") String repoRoot,
            @Value("${app.devops.deploy-script}") String deployScript) {
        this.runs = runs;
        this.processRunner = processRunner;
        this.deploymentExecutor = deploymentExecutor;
        this.repoRoot = repoRoot;
        this.deployScript = deployScript;
    }

    // Deliberately not @Transactional: runs.save() below must commit on its own before the
    // background thread (started in the same method, on a different connection) reads it back.

    public DeploymentRunResponse triggerPush(User actor) {
        return trigger(DeploymentRunType.PUSH, actor, List.of("git", "push", "origin", "HEAD"));
    }

    public DeploymentRunResponse triggerDeploy(User actor) {
        List<String> command = List.of("powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", deployScript);
        return trigger(DeploymentRunType.DEPLOY, actor, command);
    }

    @Transactional(readOnly = true)
    public DeploymentRunResponse latest(DeploymentRunType type) {
        return runs.findFirstByRunTypeOrderByStartedAtDesc(type)
                .map(DeploymentRunResponse::from)
                .orElse(null);
    }

    private DeploymentRunResponse trigger(DeploymentRunType type, User actor, List<String> command) {
        runs.findFirstByRunTypeOrderByStartedAtDesc(type)
                .filter(r -> r.getStatus() == DeploymentRunStatus.RUNNING)
                .ifPresent(r -> {
                    throw new IllegalArgumentException("A " + type.name().toLowerCase() + " is already running");
                });

        DeploymentRun run = runs.save(DeploymentRun.builder()
                .runType(type)
                .status(DeploymentRunStatus.RUNNING)
                .triggeredBy(actor)
                .startedAt(Instant.now())
                .build());

        Long runId = run.getId();
        File workingDirectory = new File(repoRoot);
        deploymentExecutor.execute(() -> runAndRecord(runId, command, workingDirectory));

        return DeploymentRunResponse.from(run);
    }

    void runAndRecord(Long runId, List<String> command, File workingDirectory) {
        ProcessResult result = processRunner.run(command, workingDirectory, TIMEOUT);

        DeploymentRun run = runs.findById(runId).orElseThrow(() -> new NoSuchElementException("Deployment run not found"));
        run.setStatus(result.success() ? DeploymentRunStatus.SUCCESS : DeploymentRunStatus.FAILED);
        run.setOutput(result.output());
        run.setFinishedAt(Instant.now());
        runs.save(run);
    }
}
