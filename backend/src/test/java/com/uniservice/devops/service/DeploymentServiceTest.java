package com.uniservice.devops.service;

import com.uniservice.auth.entity.User;
import com.uniservice.devops.dto.DeploymentRunResponse;
import com.uniservice.devops.entity.DeploymentRun;
import com.uniservice.devops.entity.DeploymentRunStatus;
import com.uniservice.devops.entity.DeploymentRunType;
import com.uniservice.devops.repository.DeploymentRunRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeploymentServiceTest {

    @Mock private DeploymentRunRepository runs;
    @Mock private ProcessRunner processRunner;

    // Runs tasks synchronously in the calling thread, so the whole trigger flow is deterministic to test.
    private final Executor syncExecutor = Runnable::run;

    private DeploymentService service;
    private User actor;

    @BeforeEach
    void setUp() {
        service = new DeploymentService(runs, processRunner, syncExecutor, "/repo", "deploy.ps1");

        actor = new User();
        actor.setId(1L);
        actor.setUsername("developer");
    }

    private DeploymentRun savedRun(Long id, DeploymentRunType type, DeploymentRunStatus status) {
        DeploymentRun run = DeploymentRun.builder()
                .runType(type).status(status).triggeredBy(actor).startedAt(java.time.Instant.now()).build();
        run.setId(id);
        return run;
    }

    @Test
    void triggerPush_runsGitPushOnOriginHead_andRecordsSuccess() {
        when(runs.findFirstByRunTypeOrderByStartedAtDesc(DeploymentRunType.PUSH)).thenReturn(Optional.empty());
        when(runs.save(any(DeploymentRun.class))).thenAnswer(inv -> {
            DeploymentRun r = inv.getArgument(0);
            if (r.getId() == null) r.setId(9L);
            return r;
        });
        when(runs.findById(9L)).thenReturn(Optional.of(savedRun(9L, DeploymentRunType.PUSH, DeploymentRunStatus.RUNNING)));
        when(processRunner.run(eq(List.of("git", "push", "origin", "HEAD")), any(File.class), any(Duration.class)))
                .thenReturn(new ProcessResult(0, "Everything up-to-date", false));

        DeploymentRunResponse result = service.triggerPush(actor);

        assertThat(result.status()).isEqualTo(DeploymentRunStatus.RUNNING);

        ArgumentCaptor<DeploymentRun> captor = ArgumentCaptor.forClass(DeploymentRun.class);
        verify(runs, times(2)).save(captor.capture());
        DeploymentRun finalState = captor.getAllValues().get(1);
        assertThat(finalState.getStatus()).isEqualTo(DeploymentRunStatus.SUCCESS);
        assertThat(finalState.getOutput()).contains("Everything up-to-date");
        assertThat(finalState.getFinishedAt()).isNotNull();
    }

    @Test
    void triggerDeploy_runsPowershellWithDeployScript() {
        when(runs.findFirstByRunTypeOrderByStartedAtDesc(DeploymentRunType.DEPLOY)).thenReturn(Optional.empty());
        when(runs.save(any(DeploymentRun.class))).thenAnswer(inv -> {
            DeploymentRun r = inv.getArgument(0);
            if (r.getId() == null) r.setId(10L);
            return r;
        });
        when(runs.findById(10L)).thenReturn(Optional.of(savedRun(10L, DeploymentRunType.DEPLOY, DeploymentRunStatus.RUNNING)));
        when(processRunner.run(any(), any(File.class), any(Duration.class)))
                .thenReturn(new ProcessResult(1, "path not found", false));

        DeploymentRunResponse result = service.triggerDeploy(actor);

        assertThat(result.runType()).isEqualTo(DeploymentRunType.DEPLOY);
        verify(processRunner).run(
                eq(List.of("powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "deploy.ps1")),
                any(File.class), any(Duration.class));

        ArgumentCaptor<DeploymentRun> captor = ArgumentCaptor.forClass(DeploymentRun.class);
        verify(runs, times(2)).save(captor.capture());
        assertThat(captor.getAllValues().get(1).getStatus()).isEqualTo(DeploymentRunStatus.FAILED);
    }

    @Test
    void trigger_whenSameTypeAlreadyRunning_throws() {
        DeploymentRun runningPush = savedRun(5L, DeploymentRunType.PUSH, DeploymentRunStatus.RUNNING);
        when(runs.findFirstByRunTypeOrderByStartedAtDesc(DeploymentRunType.PUSH)).thenReturn(Optional.of(runningPush));

        assertThatThrownBy(() -> service.triggerPush(actor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already running");

        verify(runs, never()).save(any());
    }

    @Test
    void trigger_whenPreviousRunFinished_isAllowedAgain() {
        DeploymentRun finishedPush = savedRun(5L, DeploymentRunType.PUSH, DeploymentRunStatus.SUCCESS);
        when(runs.findFirstByRunTypeOrderByStartedAtDesc(DeploymentRunType.PUSH)).thenReturn(Optional.of(finishedPush));
        when(runs.save(any(DeploymentRun.class))).thenAnswer(inv -> {
            DeploymentRun r = inv.getArgument(0);
            if (r.getId() == null) r.setId(11L);
            return r;
        });
        when(runs.findById(11L)).thenReturn(Optional.of(savedRun(11L, DeploymentRunType.PUSH, DeploymentRunStatus.RUNNING)));
        when(processRunner.run(any(), any(File.class), any(Duration.class)))
                .thenReturn(new ProcessResult(0, "ok", false));

        DeploymentRunResponse result = service.triggerPush(actor);

        assertThat(result).isNotNull();
    }

    @Test
    void latest_returnsNull_whenNoRunsYet() {
        when(runs.findFirstByRunTypeOrderByStartedAtDesc(DeploymentRunType.DEPLOY)).thenReturn(Optional.empty());

        assertThat(service.latest(DeploymentRunType.DEPLOY)).isNull();
    }

    @Test
    void latest_mapsToResponse() {
        when(runs.findFirstByRunTypeOrderByStartedAtDesc(DeploymentRunType.PUSH))
                .thenReturn(Optional.of(savedRun(7L, DeploymentRunType.PUSH, DeploymentRunStatus.SUCCESS)));

        DeploymentRunResponse result = service.latest(DeploymentRunType.PUSH);

        assertThat(result.id()).isEqualTo(7L);
        assertThat(result.status()).isEqualTo(DeploymentRunStatus.SUCCESS);
    }
}
