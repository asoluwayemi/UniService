package com.uniservice.academic.service;

import com.uniservice.academic.dto.CreateCourseRequest;
import com.uniservice.academic.dto.CreatePublicationRequest;
import com.uniservice.academic.dto.CreateSupervisionRequest;
import com.uniservice.academic.entity.AcademicCourse;
import com.uniservice.academic.entity.AcademicPublication;
import com.uniservice.academic.entity.AcademicSupervision;
import com.uniservice.academic.repository.AcademicCourseRepository;
import com.uniservice.academic.repository.AcademicPublicationRepository;
import com.uniservice.academic.repository.AcademicSupervisionRepository;
import com.uniservice.auth.entity.User;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.service.StaffProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcademicServiceTest {

    @Mock private StaffProfileService staffProfileService;
    @Mock private AcademicCourseRepository courseRepository;
    @Mock private AcademicPublicationRepository publicationRepository;
    @Mock private AcademicSupervisionRepository supervisionRepository;

    private AcademicService service;

    private User user;
    private StaffProfile profile;

    @BeforeEach
    void setUp() {
        service = new AcademicService(staffProfileService, courseRepository, publicationRepository, supervisionRepository);

        user = new User();
        user.setId(1L);
        user.setUsername("jdoe");

        profile = StaffProfile.builder().user(user).staffNumber("STAFF-0001").build();
        profile.setId(5L);
    }

    @Test
    void addCourse_defaultsEnrolledCountToZero_whenNotProvided() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        when(courseRepository.save(any(AcademicCourse.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateCourseRequest request = new CreateCourseRequest();
        request.setCourseCode("CS101");
        request.setTitle("Intro to CS");
        request.setLevel("100L");
        request.setCreditUnits(3);
        request.setSemester("First");

        AcademicCourse result = service.addCourse(request, user);

        assertThat(result.getEnrolledStudentsCount()).isEqualTo(0);
        assertThat(result.getStaffProfile()).isEqualTo(profile);
    }

    @Test
    void addPublication_defaultsImpactFactorToZero_whenNotProvided() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        when(publicationRepository.save(any(AcademicPublication.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatePublicationRequest request = new CreatePublicationRequest();
        request.setTitle("A Study");
        request.setJournalPublisher("Nature");
        request.setYearPublished(2026);
        request.setCategory("JOURNAL");
        request.setDocumentUrl("/api/uploads/abc");

        AcademicPublication result = service.addPublication(request, user);

        assertThat(result.getImpactFactor()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getDocumentUrl()).isEqualTo("/api/uploads/abc");
    }

    @Test
    void addSupervision_attachesToCallersProfile() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        when(supervisionRepository.save(any(AcademicSupervision.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateSupervisionRequest request = new CreateSupervisionRequest();
        request.setStudentName("John Smith");
        request.setMatricNumber("MAT001");
        request.setProgramme("PHD");
        request.setResearchTopic("AI");
        request.setStage("Data Collection");

        AcademicSupervision result = service.addSupervision(request, user);

        assertThat(result.getStaffProfile()).isEqualTo(profile);
    }

    @Test
    void getMyAcademicData_aggregatesAllThreeCollections() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        when(courseRepository.findByStaffProfileIdOrderByIdDesc(5L)).thenReturn(List.of(AcademicCourse.builder().build()));
        when(publicationRepository.findByStaffProfileIdOrderByIdDesc(5L)).thenReturn(List.of());
        when(supervisionRepository.findByStaffProfileIdOrderByIdDesc(5L)).thenReturn(List.of());

        var result = service.getMyAcademicData(user);

        assertThat(result.getCourses()).hasSize(1);
        assertThat(result.getPublications()).isEmpty();
    }

    @Test
    void deleteCourse_ownedByCaller_succeeds() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        AcademicCourse course = AcademicCourse.builder().staffProfile(profile).build();
        course.setId(3L);
        when(courseRepository.findById(3L)).thenReturn(Optional.of(course));

        service.deleteCourse(3L, user);

        verify(courseRepository).delete(course);
    }

    @Test
    void deleteCourse_belongingToSomeoneElse_throws() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        StaffProfile otherProfile = StaffProfile.builder().staffNumber("STAFF-0002").build();
        otherProfile.setId(99L);
        AcademicCourse course = AcademicCourse.builder().staffProfile(otherProfile).build();
        course.setId(3L);
        when(courseRepository.findById(3L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> service.deleteCourse(3L, user)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void deletePublication_belongingToSomeoneElse_throws() {
        when(staffProfileService.getOrCreateProfileFor(user)).thenReturn(profile);
        StaffProfile otherProfile = StaffProfile.builder().staffNumber("STAFF-0002").build();
        otherProfile.setId(99L);
        AcademicPublication pub = AcademicPublication.builder().staffProfile(otherProfile).build();
        pub.setId(4L);
        when(publicationRepository.findById(4L)).thenReturn(Optional.of(pub));

        assertThatThrownBy(() -> service.deletePublication(4L, user)).isInstanceOf(IllegalStateException.class);
    }
}
