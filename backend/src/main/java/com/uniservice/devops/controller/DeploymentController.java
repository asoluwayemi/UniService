package com.uniservice.devops.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.devops.dto.DeploymentRunResponse;
import com.uniservice.devops.entity.DeploymentRunType;
import com.uniservice.devops.service.DeploymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/devops")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('DEPLOYMENT_TRIGGER')")
public class DeploymentController {

    private final DeploymentService service;

    @PostMapping("/push")
    public DeploymentRunResponse push(@AuthenticationPrincipal UserPrincipal principal) {
        return service.triggerPush(principal.getUser());
    }

    @PostMapping("/deploy")
    public DeploymentRunResponse deploy(@AuthenticationPrincipal UserPrincipal principal) {
        return service.triggerDeploy(principal.getUser());
    }

    @GetMapping("/push/latest")
    public DeploymentRunResponse latestPush() {
        return service.latest(DeploymentRunType.PUSH);
    }

    @GetMapping("/deploy/latest")
    public DeploymentRunResponse latestDeploy() {
        return service.latest(DeploymentRunType.DEPLOY);
    }
}
