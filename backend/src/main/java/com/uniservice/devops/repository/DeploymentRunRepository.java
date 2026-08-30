package com.uniservice.devops.repository;

import com.uniservice.devops.entity.DeploymentRun;
import com.uniservice.devops.entity.DeploymentRunType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeploymentRunRepository extends JpaRepository<DeploymentRun, Long> {
    Optional<DeploymentRun> findFirstByRunTypeOrderByStartedAtDesc(DeploymentRunType runType);
}
