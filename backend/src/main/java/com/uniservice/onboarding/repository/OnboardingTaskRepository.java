package com.uniservice.onboarding.repository;

import com.uniservice.onboarding.entity.OnboardingCase;
import com.uniservice.onboarding.entity.OnboardingTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OnboardingTaskRepository extends JpaRepository<OnboardingTask, Long> {
    List<OnboardingTask> findByOnboardingCaseOrderBySortOrderAsc(OnboardingCase onboardingCase);
}
