package com.uniservice.academic.service;

import com.uniservice.academic.dto.*;
import com.uniservice.academic.entity.AcademicCourse;
import com.uniservice.academic.entity.AcademicPublication;
import com.uniservice.academic.entity.AcademicSupervision;
import com.uniservice.academic.repository.AcademicCourseRepository;
import com.uniservice.academic.repository.AcademicPublicationRepository;
import com.uniservice.academic.repository.AcademicSupervisionRepository;
import com.uniservice.auth.entity.User;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.service.StaffProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicService {

    private final StaffProfileService staffProfileService;
    private final AcademicCourseRepository courseRepository;
    private final AcademicPublicationRepository publicationRepository;
    private final AcademicSupervisionRepository supervisionRepository;

    @Transactional(readOnly = true)
    public AcademicDataResponse getAcademicDataByStaffProfileId(Long staffProfileId) {
        List<AcademicCourse> courses = courseRepository.findByStaffProfileIdOrderByIdDesc(staffProfileId);
        List<AcademicPublication> publications = publicationRepository.findByStaffProfileIdOrderByIdDesc(staffProfileId);
        List<AcademicSupervision> supervisions = supervisionRepository.findByStaffProfileIdOrderByIdDesc(staffProfileId);

        return AcademicDataResponse.builder()
                .courses(courses)
                .publications(publications)
                .supervisions(supervisions)
                .build();
    }

    @Transactional(readOnly = true)
    public AcademicDataResponse getMyAcademicData(User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        List<AcademicCourse> courses = courseRepository.findByStaffProfileIdOrderByIdDesc(profile.getId());
        List<AcademicPublication> publications = publicationRepository.findByStaffProfileIdOrderByIdDesc(profile.getId());
        List<AcademicSupervision> supervisions = supervisionRepository.findByStaffProfileIdOrderByIdDesc(profile.getId());

        return AcademicDataResponse.builder()
                .courses(courses)
                .publications(publications)
                .supervisions(supervisions)
                .build();
    }

    @Transactional
    public AcademicCourse addCourse(CreateCourseRequest req, User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        AcademicCourse course = AcademicCourse.builder()
                .staffProfile(profile)
                .courseCode(req.getCourseCode())
                .title(req.getTitle())
                .level(req.getLevel())
                .creditUnits(req.getCreditUnits())
                .enrolledStudentsCount(req.getEnrolledStudentsCount() != null ? req.getEnrolledStudentsCount() : 0)
                .semester(req.getSemester())
                .syllabusUrl(req.getSyllabusUrl())
                .build();
        return courseRepository.save(course);
    }

    @Transactional
    public AcademicPublication addPublication(CreatePublicationRequest req, User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        AcademicPublication pub = AcademicPublication.builder()
                .staffProfile(profile)
                .title(req.getTitle())
                .journalPublisher(req.getJournalPublisher())
                .yearPublished(req.getYearPublished())
                .doiIsbn(req.getDoiIsbn())
                .category(req.getCategory())
                .impactFactor(req.getImpactFactor() != null ? req.getImpactFactor() : BigDecimal.ZERO)
                .documentUrl(req.getDocumentUrl())
                .build();
        return publicationRepository.save(pub);
    }

    @Transactional
    public AcademicSupervision addSupervision(CreateSupervisionRequest req, User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        AcademicSupervision supervision = AcademicSupervision.builder()
                .staffProfile(profile)
                .studentName(req.getStudentName())
                .matricNumber(req.getMatricNumber())
                .programme(req.getProgramme())
                .researchTopic(req.getResearchTopic())
                .stage(req.getStage())
                .build();
        return supervisionRepository.save(supervision);
    }

    @Transactional
    public void deleteCourse(Long id, User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        AcademicCourse course = courseRepository.findById(id).orElseThrow();
        if (!course.getStaffProfile().getId().equals(profile.getId())) {
            throw new IllegalStateException("Unauthorized");
        }
        courseRepository.delete(course);
    }

    @Transactional
    public void deletePublication(Long id, User actor) {
        StaffProfile profile = staffProfileService.getOrCreateProfileFor(actor);
        AcademicPublication pub = publicationRepository.findById(id).orElseThrow();
        if (!pub.getStaffProfile().getId().equals(profile.getId())) {
            throw new IllegalStateException("Unauthorized");
        }
        publicationRepository.delete(pub);
    }
}
