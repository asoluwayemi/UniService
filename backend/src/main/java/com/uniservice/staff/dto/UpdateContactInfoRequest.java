package com.uniservice.staff.dto;

import com.uniservice.staff.entity.Gender;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateContactInfoRequest {

    private LocalDate dateOfBirth;
    private Gender gender;
    private String phone;
    private String address;
    private String nationality;
    private String emergencyContactName;
    private String emergencyContactRelationship;
    private String emergencyContactPhone;
}
