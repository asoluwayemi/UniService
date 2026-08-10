package com.uniservice.nonacademic.dto;

import com.uniservice.nonacademic.entity.NonAcademicProject;
import com.uniservice.nonacademic.entity.NonAcademicTraining;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NonAcademicDataResponse {
    private List<NonAcademicTraining> trainings;
    private List<NonAcademicProject> projects;
}
