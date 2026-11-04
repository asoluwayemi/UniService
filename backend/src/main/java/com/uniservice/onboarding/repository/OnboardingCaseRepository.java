package com.uniservice.onboarding.repository;

import com.uniservice.onboarding.entity.OnboardingCase;
import com.uniservice.recruitment.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OnboardingCaseRepository extends JpaRepository<OnboardingCase, Long> {
    List<OnboardingCase> findAllByOrderByStartDateDesc();

    boolean existsByApplication(JobApplication application);
}
