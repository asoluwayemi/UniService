package com.uniservice.nonacademic.entity;

import com.uniservice.core.common.BaseEntity;
import com.uniservice.staff.entity.StaffProfile;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "non_academic_trainings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NonAcademicTraining extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_profile_id", nullable = false)
    private StaffProfile staffProfile;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 200)
    private String organizer;

    @Column(name = "year_attended", nullable = false)
    private Integer yearAttended;

    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    @Column(name = "certificate_url", length = 500)
    private String certificateUrl;
}
