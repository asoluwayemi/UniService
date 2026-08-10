package com.uniservice.staff.dto;

import com.uniservice.staff.entity.EmploymentStatus;
import com.uniservice.staff.entity.EmploymentType;
import com.uniservice.staff.entity.Gender;
import com.uniservice.staff.entity.StaffCategory;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateStaffProfileRequest {

    private LocalDate dateOfBirth;
    private Gender gender;
    private String phone;
    private String address;
    private String nationality;

    @NotNull
    private StaffCategory category;

    private String designation;
    private Long orgUnitId;

    @NotNull
    private EmploymentType employmentType;

    @NotNull
    private EmploymentStatus employmentStatus;

    @NotNull
    private LocalDate dateOfHire;

    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private String bankName;
    private String bankAccountName;
    private String bankAccountNumber;
    private LocalDate dateOfFirstAppointment;
    private LocalDate dateAppointedToPresentPost;
    private String scheduleOfDuties;
    private String presentScaleAndSalary;
    private LocalDate dateOfNextIncrement;
    private LocalDate lastPromotionDate;
    private LocalDate promotionDueDate;
    private Integer gradeLevel;
    private Integer gradeStep;
    private String cadre;
    private String ippisNumber;
    private String nin;
    private String tin;
}
