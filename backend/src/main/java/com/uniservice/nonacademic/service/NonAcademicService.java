package com.uniservice.nonacademic.service;

import com.uniservice.auth.entity.User;
import com.uniservice.nonacademic.dto.*;
import com.uniservice.nonacademic.entity.NonAcademicProject;
import com.uniservice.nonacademic.entity.NonAcademicTraining;
import com.uniservice.nonacademic.repository.NonAcademicProjectRepository;
import com.uniservice.nonacademic.repository.NonAcademicTrainingRepository;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.service.StaffProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NonAcademicService {

    private final StaffProfileService staffProfileService;
    private final NonAcademicTrainingRepository trainingRepository;
    private final NonAcademicProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public NonAcademicDataResponse getMyNonAcademicData(User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        return getNonAcademicDataByStaffProfileId(profile.getId());
    }

    @Transactional(readOnly = true)
    public NonAcademicDataResponse getNonAcademicDataByStaffProfileId(Long staffProfileId) {
        List<NonAcademicTraining> trainings = trainingRepository.findByStaffProfileIdOrderByIdDesc(staffProfileId);
        List<NonAcademicProject> projects = projectRepository.findByStaffProfileIdOrderByIdDesc(staffProfileId);

        return NonAcademicDataResponse.builder()
                .trainings(trainings)
                .projects(projects)
                .build();
    }

    @Transactional
    public NonAcademicTraining addTraining(CreateTrainingRequest req, User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        NonAcademicTraining training = NonAcademicTraining.builder()
                .staffProfile(profile)
                .title(req.getTitle())
                .organizer(req.getOrganizer())
                .yearAttended(req.getYearAttended())
                .certificateNumber(req.getCertificateNumber())
                .certificateUrl(req.getCertificateUrl())
                .build();
        return trainingRepository.save(training);
    }

    @Transactional
    public NonAcademicProject addProject(CreateProjectRequest req, User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        NonAcademicProject project = NonAcademicProject.builder()
                .staffProfile(profile)
                .projectTitle(req.getProjectTitle())
                .role(req.getRole())
                .description(req.getDescription())
                .status(req.getStatus() != null ? req.getStatus() : "COMPLETED")
                .build();
        return projectRepository.save(project);
    }

    @Transactional
    public void deleteTraining(Long id, User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        NonAcademicTraining tr = trainingRepository.findById(id).orElseThrow();
        if (!tr.getStaffProfile().getId().equals(profile.getId())) {
            throw new IllegalStateException("Unauthorized");
        }
        trainingRepository.delete(tr);
    }

    @Transactional
    public void deleteProject(Long id, User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        NonAcademicProject pr = projectRepository.findById(id).orElseThrow();
        if (!pr.getStaffProfile().getId().equals(profile.getId())) {
            throw new IllegalStateException("Unauthorized");
        }
        projectRepository.delete(pr);
    }
}
