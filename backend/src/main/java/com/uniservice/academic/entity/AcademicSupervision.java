package com.uniservice.academic.entity;

import com.uniservice.core.common.BaseEntity;
import com.uniservice.staff.entity.StaffProfile;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "academic_supervisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicSupervision extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_profile_id", nullable = false)
    private StaffProfile staffProfile;

    @Column(name = "student_name", nullable = false, length = 150)
    private String studentName;

    @Column(name = "matric_number", nullable = false, length = 50)
    private String matricNumber;

    @Column(nullable = false, length = 30)
    private String programme;

    @Column(name = "research_topic", nullable = false, length = 300)
    private String researchTopic;

    @Column(nullable = false, length = 100)
    private String stage;
}
