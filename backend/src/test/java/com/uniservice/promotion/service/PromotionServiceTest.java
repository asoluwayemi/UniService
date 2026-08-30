package com.uniservice.promotion.service;

import com.uniservice.appraisal.service.AppraisalService;
import com.uniservice.auth.entity.User;
import com.uniservice.notification.service.NotificationService;
import com.uniservice.promotion.dto.*;
import com.uniservice.promotion.entity.PromotionApplication;
import com.uniservice.promotion.entity.PromotionApplicationStatus;
import com.uniservice.promotion.repository.PromotionApplicationRepository;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.StaffProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PromotionServiceTest {

    @Mock private StaffProfileRepository staffProfiles;
    @Mock private PromotionApplicationRepository applications;
    @Mock private AppraisalService appraisals;
    @Mock private NotificationService notificationService;

    private PromotionService service;

    private User staffUser;
    private User reviewer;
    private StaffProfile profile;

    @BeforeEach
    void setUp() {
        service = new PromotionService(staffProfiles, applications, appraisals, notificationService);

        staffUser = new User();
        staffUser.setId(1L);
        staffUser.setUsername("jdoe");
        staffUser.setFirstName("Jane");
        staffUser.setLastName("Doe");

        reviewer = new User();
        reviewer.setId(2L);
        reviewer.setUsername("hr");

        profile = StaffProfile.builder().user(staffUser).staffNumber("STAFF-0001").gradeLevel(10).gradeStep(3).build();
        profile.setId(5L);
    }

    private PromotionApplication application(PromotionApplicationStatus status) {
        PromotionApplication app = PromotionApplication.builder()
                .staffProfile(profile)
                .currentGradeLevel(10)
                .requestedGradeLevel(11)
                .eligibilityDate(LocalDate.now())
                .status(status)
                .build();
        app.setId(9L);
        return app;
    }

    private PromotionCommentRequest comment(String text) {
        PromotionCommentRequest r = new PromotionCommentRequest();
        r.setComment(text);
        return r;
    }

    // --- getById ---

    @Test
    void getById_ownApplication_isVisibleWithoutManagePermission() {
        PromotionApplication app = application(PromotionApplicationStatus.SUBMITTED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        PromotionApplicationResponse result = service.getById(9L, staffUser, false);

        assertThat(result.id()).isEqualTo(9L);
        assertThat(result.staffFullName()).isEqualTo("Jane Doe");
    }

    @Test
    void getById_someoneElsesApplicationWithoutManagePermission_throws() {
        PromotionApplication app = application(PromotionApplicationStatus.SUBMITTED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        User stranger = new User();
        stranger.setId(99L);

        assertThatThrownBy(() -> service.getById(9L, stranger, false))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getById_anyApplicationWithManagePermission_isVisible() {
        PromotionApplication app = application(PromotionApplicationStatus.SUBMITTED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        User stranger = new User();
        stranger.setId(99L);

        PromotionApplicationResponse result = service.getById(9L, stranger, true);

        assertThat(result.id()).isEqualTo(9L);
    }

    // --- requestMoreDocuments ---

    @Test
    void requestMoreDocuments_fromSubmitted_movesToDocumentsPending() {
        PromotionApplication app = application(PromotionApplicationStatus.SUBMITTED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        PromotionApplicationResponse result = service.requestMoreDocuments(9L, comment("Need transcript"), reviewer);

        assertThat(result.status()).isEqualTo(PromotionApplicationStatus.DOCUMENTS_PENDING);
        assertThat(app.getReviewedBy()).isEqualTo(reviewer);
        verify(notificationService).notify(eq(staffUser), contains("Need transcript"), eq("/career"));
    }

    @Test
    void requestMoreDocuments_withoutComment_throws() {
        PromotionApplication app = application(PromotionApplicationStatus.SUBMITTED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        assertThatThrownBy(() -> service.requestMoreDocuments(9L, comment(""), reviewer))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void requestMoreDocuments_fromWrongStatus_throws() {
        PromotionApplication app = application(PromotionApplicationStatus.APPROVED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        assertThatThrownBy(() -> service.requestMoreDocuments(9L, comment("x"), reviewer))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be transitioned");
    }

    // --- verifyDocuments ---

    @Test
    void verifyDocuments_fromDocumentsPending_movesToDocumentsVerified() {
        PromotionApplication app = application(PromotionApplicationStatus.DOCUMENTS_PENDING);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        PromotionApplicationResponse result = service.verifyDocuments(9L, comment(null), reviewer);

        assertThat(result.status()).isEqualTo(PromotionApplicationStatus.DOCUMENTS_VERIFIED);
    }

    // --- scheduleExam / scheduleInterview ---

    @Test
    void scheduleExam_fromDocumentsVerified_setsExamDate() {
        PromotionApplication app = application(PromotionApplicationStatus.DOCUMENTS_VERIFIED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        SchedulePromotionExamRequest request = new SchedulePromotionExamRequest();
        request.setExamDate(LocalDate.of(2026, 9, 1));

        PromotionApplicationResponse result = service.scheduleExam(9L, request, reviewer);

        assertThat(result.status()).isEqualTo(PromotionApplicationStatus.EXAM_SCHEDULED);
        assertThat(result.examScheduledDate()).isEqualTo(LocalDate.of(2026, 9, 1));
    }

    @Test
    void scheduleExam_fromWrongStatus_throws() {
        PromotionApplication app = application(PromotionApplicationStatus.SUBMITTED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        SchedulePromotionExamRequest request = new SchedulePromotionExamRequest();
        request.setExamDate(LocalDate.now());

        assertThatThrownBy(() -> service.scheduleExam(9L, request, reviewer))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void scheduleInterview_fromExamScheduled_setsInterviewDate() {
        PromotionApplication app = application(PromotionApplicationStatus.EXAM_SCHEDULED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        SchedulePromotionInterviewRequest request = new SchedulePromotionInterviewRequest();
        request.setInterviewDate(LocalDate.of(2026, 10, 1));

        PromotionApplicationResponse result = service.scheduleInterview(9L, request, reviewer);

        assertThat(result.status()).isEqualTo(PromotionApplicationStatus.ORAL_INTERVIEW_SCHEDULED);
        assertThat(result.interviewScheduledDate()).isEqualTo(LocalDate.of(2026, 10, 1));
    }

    // --- recommend / approve / gazette ---

    @Test
    void recommend_fromInterviewScheduled_movesToRecommended() {
        PromotionApplication app = application(PromotionApplicationStatus.ORAL_INTERVIEW_SCHEDULED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        PromotionApplicationResponse result = service.recommend(9L, comment("Strong candidate"), reviewer);

        assertThat(result.status()).isEqualTo(PromotionApplicationStatus.RECOMMENDED);
    }

    @Test
    void approve_fromRecommended_updatesStaffGradeAndPromotionDate() {
        PromotionApplication app = application(PromotionApplicationStatus.RECOMMENDED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));
        when(staffProfiles.save(any(StaffProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        PromotionApplicationResponse result = service.approve(9L, comment("Approved"), reviewer);

        assertThat(result.status()).isEqualTo(PromotionApplicationStatus.APPROVED);
        assertThat(profile.getGradeLevel()).isEqualTo(11);
        assertThat(profile.getGradeStep()).isEqualTo(1);
        assertThat(profile.getLastPromotionDate()).isEqualTo(LocalDate.now());
        verify(staffProfiles).save(profile);
    }

    @Test
    void approve_fromWrongStatus_throwsAndDoesNotTouchStaffProfile() {
        PromotionApplication app = application(PromotionApplicationStatus.EXAM_SCHEDULED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        assertThatThrownBy(() -> service.approve(9L, comment("x"), reviewer))
                .isInstanceOf(IllegalArgumentException.class);

        verify(staffProfiles, never()).save(any());
        assertThat(profile.getGradeLevel()).isEqualTo(10);
    }

    @Test
    void gazette_fromApproved_movesToGazetted() {
        PromotionApplication app = application(PromotionApplicationStatus.APPROVED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        PromotionApplicationResponse result = service.gazette(9L, comment(null), reviewer);

        assertThat(result.status()).isEqualTo(PromotionApplicationStatus.GAZETTED);
    }

    // --- reject ---

    @Test
    void reject_fromAnyActiveStatus_movesToRejected() {
        PromotionApplication app = application(PromotionApplicationStatus.EXAM_SCHEDULED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        PromotionApplicationResponse result = service.reject(9L, comment("Did not meet requirements"), reviewer);

        assertThat(result.status()).isEqualTo(PromotionApplicationStatus.REJECTED);
    }

    @Test
    void reject_withoutComment_throws() {
        PromotionApplication app = application(PromotionApplicationStatus.SUBMITTED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        assertThatThrownBy(() -> service.reject(9L, comment(" "), reviewer))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void reject_fromTerminalStatus_throws() {
        PromotionApplication app = application(PromotionApplicationStatus.GAZETTED);
        when(applications.findById(9L)).thenReturn(Optional.of(app));

        assertThatThrownBy(() -> service.reject(9L, comment("too late"), reviewer))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // --- listAll ---

    @Test
    void listAll_returnsSummariesForEveryApplication() {
        when(applications.findAll()).thenReturn(List.of(application(PromotionApplicationStatus.SUBMITTED)));

        List<PromotionSummaryResponse> result = service.listAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).staffFullName()).isEqualTo("Jane Doe");
    }
}
