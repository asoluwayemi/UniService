package com.uniservice.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCourseRequest {
    @NotBlank(message = "Course code is required")
    private String courseCode;

    @NotBlank(message = "Course title is required")
    private String title;

    @NotBlank(message = "Course level is required")
    private String level;

    @NotNull(message = "Credit units is required")
    private Integer creditUnits;

    private Integer enrolledStudentsCount;

    @NotBlank(message = "Semester is required")
    private String semester;

    private String syllabusUrl;
}
