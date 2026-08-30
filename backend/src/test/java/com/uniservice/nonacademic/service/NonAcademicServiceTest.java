package com.uniservice.nonacademic.service;

import com.uniservice.auth.entity.User;
import com.uniservice.nonacademic.dto.CreateProjectRequest;
import com.uniservice.nonacademic.dto.CreateTrainingRequest;
import com.uniservice.nonacademic.entity.NonAcademicProject;
import com.uniservice.nonacademic.entity.NonAcademicTraining;
import com.uniservice.nonacademic.repository.NonAcademicProjectRepository;
import com.uniservice.nonacademic.repository.NonAcademicTrainingRepository;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.service.StaffProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NonAcademicServiceTest {

    @Mock private StaffProfileService staffProfileService;
    @Mock private NonAcademicTrainingRepository trainingRepository;
    @Mock private NonAcademicProjectRepository projectRepository;

    private NonAcademicService service;

    private User user;
    private StaffProfile profile;

    @BeforeEach
    void setUp() {
        service = new NonAcademicService(staffProfileService, trainingRepository, projectRepository);

        user = new User();
        user.setId(1L);
        user.setUsername("jdoe");

        profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").build();
        profile.setId(5L);
    }

    @Test
    void addTraining_attachesToCallersProfile() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        when(trainingRepository.save(any(NonAcademicTraining.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateTrainingRequest request = new CreateTrainingRequest();
        request.setTitle("Leadership Workshop");
        request.setOrganizer("HR Dept");
        request.setYearAttended(2026);

        NonAcademicTraining result = service.addTraining(request, user);

        assertThat(result.getStaffProfile()).isEqualTo(profile);
        assertThat(result.getTitle()).isEqualTo("Leadership Workshop");
    }

    @Test
    void addProject_defaultsStatusToCompleted_whenNotProvided() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        when(projectRepository.save(any(NonAcademicProject.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateProjectRequest request = new CreateProjectRequest();
        request.setProjectTitle("New Wing Construction");
        request.setRole("Coordinator");

        NonAcademicProject result = service.addProject(request, user);

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
    }

    @Test
    void addProject_keepsProvidedStatus() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        when(projectRepository.save(any(NonAcademicProject.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateProjectRequest request = new CreateProjectRequest();
        request.setProjectTitle("New Wing Construction");
        request.setRole("Coordinator");
        request.setStatus("IN_PROGRESS");

        NonAcademicProject result = service.addProject(request, user);

        assertThat(result.getStatus()).isEqualTo("IN_PROGRESS");
    }

    @Test
    void getMyNonAcademicData_aggregatesTrainingsAndProjects() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        when(trainingRepository.findByStaffProfileIdOrderByIdDesc(5L)).thenReturn(List.of(NonAcademicTraining.builder().build()));
        when(projectRepository.findByStaffProfileIdOrderByIdDesc(5L)).thenReturn(List.of());

        var result = service.getMyNonAcademicData(user);

        assertThat(result.getTrainings()).hasSize(1);
        assertThat(result.getProjects()).isEmpty();
    }

    @Test
    void deleteTraining_ownedByCaller_succeeds() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        NonAcademicTraining training = NonAcademicTraining.builder().staffProfile(profile).build();
        training.setId(3L);
        when(trainingRepository.findById(3L)).thenReturn(Optional.of(training));

        service.deleteTraining(3L, user);

        verify(trainingRepository).delete(training);
    }

    @Test
    void deleteTraining_belongingToSomeoneElse_throws() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        StaffProfile otherProfile = StaffProfile.builder().staffNumber("STAFF-0002").build();
        otherProfile.setId(99L);
        NonAcademicTraining training = NonAcademicTraining.builder().staffProfile(otherProfile).build();
        training.setId(3L);
        when(trainingRepository.findById(3L)).thenReturn(Optional.of(training));

        assertThatThrownBy(() -> service.deleteTraining(3L, user)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void deleteProject_belongingToSomeoneElse_throws() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        StaffProfile otherProfile = StaffProfile.builder().staffNumber("STAFF-0002").build();
        otherProfile.setId(99L);
        NonAcademicProject project = NonAcademicProject.builder().staffProfile(otherProfile).build();
        project.setId(4L);
        when(projectRepository.findById(4L)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> service.deleteProject(4L, user)).isInstanceOf(IllegalStateException.class);
    }
}
