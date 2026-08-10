package com.uniservice.academic.entity;

import com.uniservice.core.common.BaseEntity;
import com.uniservice.staff.entity.StaffProfile;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "academic_courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicCourse extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_profile_id", nullable = false)
    private StaffProfile staffProfile;

    @Column(name = "course_code", nullable = false, length = 30)
    private String courseCode;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 50)
    private String level;

    @Column(name = "credit_units", nullable = false)
    private Integer creditUnits;

    @Column(name = "enrolled_students_count", nullable = false)
    private Integer enrolledStudentsCount;

    @Column(nullable = false, length = 100)
    private String semester;

    @Column(name = "syllabus_url", length = 500)
    private String syllabusUrl;
}
