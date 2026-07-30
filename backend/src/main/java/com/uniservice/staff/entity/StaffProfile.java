package com.uniservice.staff.entity;

import com.uniservice.auth.entity.User;
import com.uniservice.core.common.BaseEntity;
import com.uniservice.org.entity.OrgUnit;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "staff_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "staff_number", nullable = false, length = 30, unique = true)
    private String staffNumber;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    @Column(length = 30)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String nationality;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StaffCategory category;

    @Column(length = 150)
    private String designation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_unit_id")
    private OrgUnit orgUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false, length = 20)
    private EmploymentType employmentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", nullable = false, length = 20)
    @Builder.Default
    private EmploymentStatus employmentStatus = EmploymentStatus.ACTIVE;

    @Column(name = "date_of_hire", nullable = false)
    private LocalDate dateOfHire;

    @Column(name = "contract_start_date")
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;

    @Column(name = "bank_name", length = 150)
    private String bankName;

    @Column(name = "bank_account_name", length = 150)
    private String bankAccountName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "date_of_first_appointment")
    private LocalDate dateOfFirstAppointment;

    @Column(name = "date_appointed_to_present_post")
    private LocalDate dateAppointedToPresentPost;

    @Column(name = "schedule_of_duties", length = 500)
    private String scheduleOfDuties;

    @Column(name = "present_scale_and_salary", length = 100)
    private String presentScaleAndSalary;

    @Column(name = "date_of_next_increment")
    private LocalDate dateOfNextIncrement;

    @Column(name = "last_promotion_date")
    private LocalDate lastPromotionDate;
}
