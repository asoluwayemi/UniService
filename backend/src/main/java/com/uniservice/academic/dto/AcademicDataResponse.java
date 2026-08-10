package com.uniservice.academic.dto;

import com.uniservice.academic.entity.AcademicCourse;
import com.uniservice.academic.entity.AcademicPublication;
import com.uniservice.academic.entity.AcademicSupervision;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademicDataResponse {
    private List<AcademicCourse> courses;
    private List<AcademicPublication> publications;
    private List<AcademicSupervision> supervisions;
}
