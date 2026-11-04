package com.uniservice.onboarding.entity;

import com.uniservice.auth.entity.User;
import com.uniservice.core.common.BaseEntity;
import com.uniservice.recruitment.entity.JobApplication;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "onboarding_cases")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OnboardingCase extends BaseEntity {
    @Column(name = "new_hire_name", nullable = false, length = 200) private String newHireName;
    @Column(nullable = false) private String email;
    @Column(nullable = false, length = 200) private String position;
    @Column(nullable = false, length = 200) private String department;
    @Column(name = "start_date", nullable = false) private LocalDate startDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OnboardingStatus status = OnboardingStatus.IN_PROGRESS;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private JobApplication application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
