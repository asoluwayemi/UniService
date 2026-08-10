package com.uniservice.nonacademic.entity;

import com.uniservice.core.common.BaseEntity;
import com.uniservice.staff.entity.StaffProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "non_academic_projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NonAcademicProject extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_profile_id", nullable = false)
    private StaffProfile staffProfile;

    @Column(name = "project_title", nullable = false, length = 300)
    private String projectTitle;

    @Column(nullable = false, length = 150)
    private String role;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String status;
}
