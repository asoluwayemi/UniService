package com.uniservice.academic.entity;

import com.uniservice.core.common.BaseEntity;
import com.uniservice.staff.entity.StaffProfile;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "academic_publications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicPublication extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_profile_id", nullable = false)
    private StaffProfile staffProfile;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(name = "journal_publisher", nullable = false, length = 200)
    private String journalPublisher;

    @Column(name = "year_published", nullable = false)
    private Integer yearPublished;

    @Column(name = "doi_isbn", length = 100)
    private String doiIsbn;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(name = "impact_factor", precision = 5, scale = 2)
    private BigDecimal impactFactor;

    @Column(name = "document_url", length = 500)
    private String documentUrl;
}
