package com.uniservice.recruitment.service;

import com.uniservice.audit.service.AuditService;
import com.uniservice.auth.entity.User;
import com.uniservice.recruitment.dto.*;
import com.uniservice.recruitment.entity.*;
import com.uniservice.recruitment.repository.JobApplicationRepository;
import com.uniservice.recruitment.repository.JobPostingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecruitmentServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2027, 3, 10);

    @Mock private JobPostingRepository postings;
    @Mock private JobApplicationRepository applications;
    @Mock private AuditService audit;

    private RecruitmentService service;
    private User hr;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(TODAY.atTime(10, 0).toInstant(ZoneOffset.UTC), ZoneOffset.UTC);
        service = new RecruitmentService(postings, applications, audit, clock);
        hr = new User();
        hr.setUsername("hr");
    }

    private JobPosting posting(PostingStatus status, LocalDate closing) {
        JobPosting p = JobPosting.builder().title("Lecturer").department("Physics").category(PostingCategory.ACADEMIC)
                .description("d").status(status).closingDate(closing).build();
        p.setId(1L);
        return p;
    }

    private JobApplication application(ApplicationStage stage) {
        JobApplication a = JobApplication.builder().posting(posting(PostingStatus.OPEN, null))
                .applicantName("Ada").email("ada@x.com").stage(stage).appliedAt(Instant.now()).build();
        a.setId(9L);
        return a;
    }

    private void echoSave() {
        when(applications.save(any(JobApplication.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void createPosting_startsAsDraft_andIsAudited() {
        when(postings.save(any(JobPosting.class))).thenAnswer(i -> {
            JobPosting p = i.getArgument(0);
            p.setId(3L);
            return p;
        });

        JobPostingResponse r = service.createPosting(
                new JobPostingRequest(" Lecturer ", "Physics", PostingCategory.ACADEMIC, "desc", TODAY.plusDays(5)), hr);

        assertThat(r.status()).isEqualTo(PostingStatus.DRAFT);
        assertThat(r.title()).isEqualTo("Lecturer");
        verify(audit).record(eq("hr"), eq("JOB_POSTING_CREATED"), eq("JobPosting"), eq("3"), any());
    }

    @Test
    void createPosting_rejectsPastClosingDate() {
        assertThatThrownBy(() -> service.createPosting(
                new JobPostingRequest("t", "d", PostingCategory.ACADEMIC, "x", TODAY.minusDays(1)), hr))
                .isInstanceOf(IllegalArgumentException.class);
        verify(postings, never()).save(any());
    }

    @Test
    void setStatus_opensDraft_butClosedCannotReopen() {
        JobPosting draft = posting(PostingStatus.DRAFT, null);
        JobPosting closed = posting(PostingStatus.CLOSED, null);
        when(postings.findById(1L)).thenReturn(Optional.of(draft));
        when(postings.save(any(JobPosting.class))).thenAnswer(i -> i.getArgument(0));

        assertThat(service.setStatus(1L, PostingStatus.OPEN, hr).status()).isEqualTo(PostingStatus.OPEN);

        when(postings.findById(2L)).thenReturn(Optional.of(closed));
        assertThatThrownBy(() -> service.setStatus(2L, PostingStatus.OPEN, hr)).hasMessageContaining("closed");
    }

    @Test
    void addApplication_onOpenPosting_normalisesEmail() {
        JobPosting open = posting(PostingStatus.OPEN, TODAY);
        when(postings.findById(1L)).thenReturn(Optional.of(open));
        when(applications.existsByPostingAndEmailIgnoreCase(open, "ada@x.com")).thenReturn(false);
        echoSave();

        ApplicationResponse r = service.addApplication(1L, new ApplicationRequest(" Ada ", " ADA@x.com ", null, null), hr);

        assertThat(r.email()).isEqualTo("ada@x.com");
        assertThat(r.applicantName()).isEqualTo("Ada");
        assertThat(r.stage()).isEqualTo(ApplicationStage.APPLIED);
    }

    @Test
    void addApplication_rejectsNonOpen_expired_andDuplicate() {
        when(postings.findById(1L)).thenReturn(Optional.of(posting(PostingStatus.DRAFT, null)));
        assertThatThrownBy(() -> service.addApplication(1L, new ApplicationRequest("A", "a@x.com", null, null), hr))
                .hasMessageContaining("not open");

        when(postings.findById(2L)).thenReturn(Optional.of(posting(PostingStatus.OPEN, TODAY.minusDays(1))));
        assertThatThrownBy(() -> service.addApplication(2L, new ApplicationRequest("A", "a@x.com", null, null), hr))
                .hasMessageContaining("passed");

        JobPosting open = posting(PostingStatus.OPEN, null);
        when(postings.findById(3L)).thenReturn(Optional.of(open));
        when(applications.existsByPostingAndEmailIgnoreCase(open, "a@x.com")).thenReturn(true);
        assertThatThrownBy(() -> service.addApplication(3L, new ApplicationRequest("A", "a@x.com", null, null), hr))
                .hasMessageContaining("already exists");
        verify(applications, never()).save(any());
    }

    @Test
    void changeStage_followsThePipeline() {
        JobApplication a = application(ApplicationStage.APPLIED);
        when(applications.findById(9L)).thenReturn(Optional.of(a));
        echoSave();

        ApplicationResponse r = service.changeStage(9L, new StageChangeRequest(ApplicationStage.SHORTLISTED, null), hr);

        assertThat(r.stage()).isEqualTo(ApplicationStage.SHORTLISTED);
        assertThat(r.allowedNext()).containsExactlyInAnyOrder(ApplicationStage.INTERVIEW, ApplicationStage.REJECTED);
        verify(audit).record(eq("hr"), eq("APPLICATION_SHORTLISTED"), eq("JobApplication"), eq("9"), any());
    }

    @Test
    void changeStage_cannotSkipStagesOrLeaveFinalStates() {
        when(applications.findById(9L)).thenReturn(Optional.of(application(ApplicationStage.APPLIED)));
        assertThatThrownBy(() -> service.changeStage(9L, new StageChangeRequest(ApplicationStage.HIRED, null), hr))
                .hasMessageContaining("Cannot move");

        when(applications.findById(8L)).thenReturn(Optional.of(application(ApplicationStage.REJECTED)));
        assertThatThrownBy(() -> service.changeStage(8L, new StageChangeRequest(ApplicationStage.SHORTLISTED, null), hr))
                .isInstanceOf(IllegalArgumentException.class);
        verify(applications, never()).save(any());
    }

    @Test
    void changeStage_rejectionNeedsAReason() {
        when(applications.findById(9L)).thenReturn(Optional.of(application(ApplicationStage.INTERVIEW)));
        assertThatThrownBy(() -> service.changeStage(9L, new StageChangeRequest(ApplicationStage.REJECTED, "  "), hr))
                .hasMessageContaining("reason");

        echoSave();
        assertThat(service.changeStage(9L, new StageChangeRequest(ApplicationStage.REJECTED, "Not a fit"), hr).stageNote())
                .isEqualTo("Not a fit");
    }

    @Test
    void changeStage_unknownApplication_notFound() {
        when(applications.findById(5L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.changeStage(5L, new StageChangeRequest(ApplicationStage.SHORTLISTED, null), hr))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void listPostings_includesApplicationCounts() {
        JobPosting p = posting(PostingStatus.OPEN, null);
        when(postings.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(p));
        when(applications.countByPosting(p)).thenReturn(4L);

        assertThat(service.listPostings().get(0).applicationCount()).isEqualTo(4);
    }
}
