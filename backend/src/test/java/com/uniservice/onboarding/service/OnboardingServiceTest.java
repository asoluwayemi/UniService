package com.uniservice.onboarding.service;

import com.uniservice.audit.service.AuditService;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.onboarding.dto.*;
import com.uniservice.onboarding.entity.*;
import com.uniservice.onboarding.repository.OnboardingCaseRepository;
import com.uniservice.onboarding.repository.OnboardingTaskRepository;
import com.uniservice.recruitment.entity.*;
import com.uniservice.recruitment.repository.JobApplicationRepository;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.StaffProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OnboardingServiceTest {

    @Mock private OnboardingCaseRepository cases;
    @Mock private OnboardingTaskRepository tasks;
    @Mock private JobApplicationRepository applications;
    @Mock private UserRepository users;
    @Mock private StaffProfileRepository staff;
    @Mock private AuditService audit;

    private OnboardingService service;
    private User hr;
    private final LocalDate start = LocalDate.of(2027, 4, 1);

    @BeforeEach
    void setUp() {
        service = new OnboardingService(cases, tasks, applications, users, staff, audit, Clock.systemUTC());
        hr = new User();
        hr.setUsername("hr");
    }

    private OnboardingCase theCase(OnboardingStatus status) {
        OnboardingCase c = OnboardingCase.builder().newHireName("Ada").email("a@x.com").position("Lecturer")
                .department("Physics").startDate(start).status(status).build();
        c.setId(1L);
        return c;
    }

    private List<OnboardingTask> taskList(OnboardingCase c, int total, int doneCount) {
        List<OnboardingTask> list = new ArrayList<>();
        for (int i = 0; i < total; i++) {
            OnboardingTask t = OnboardingTask.builder().onboardingCase(c).sortOrder(i).title("T" + i).ownerTeam("HR")
                    .done(i < doneCount).build();
            t.setId((long) (i + 1));
            list.add(t);
        }
        return list;
    }

    private void echoCaseSave() {
        when(cases.save(any(OnboardingCase.class))).thenAnswer(i -> {
            OnboardingCase c = i.getArgument(0);
            if (c.getId() == null) c.setId(1L);
            return c;
        });
    }

    @Test
    void create_seedsTheStandardChecklist() {
        echoCaseSave();

        service.create(new OnboardingCaseRequest(" Ada ", "A@X.com", "Lecturer", "Physics", start), hr);

        verify(tasks, times(OnboardingService.TEMPLATE.size())).save(any(OnboardingTask.class));
        verify(audit).record(eq("hr"), eq("ONBOARDING_STARTED"), eq("OnboardingCase"), eq("1"), any());
    }

    @Test
    void createFromApplication_copiesPostingDetails_forHiredApplicantsOnly() {
        JobPosting posting = JobPosting.builder().title("Lecturer I").department("Physics").build();
        JobApplication hired = JobApplication.builder().posting(posting).applicantName("Ada Obi").email("ada@x.com")
                .stage(ApplicationStage.HIRED).appliedAt(Instant.now()).build();
        hired.setId(7L);
        when(applications.findById(7L)).thenReturn(Optional.of(hired));
        when(cases.existsByApplication(hired)).thenReturn(false);
        echoCaseSave();

        OnboardingCaseResponse r = service.createFromApplication(7L, new FromApplicationRequest(start), hr);

        assertThat(r.newHireName()).isEqualTo("Ada Obi");
        assertThat(r.position()).isEqualTo("Lecturer I");
        assertThat(r.department()).isEqualTo("Physics");
        assertThat(r.applicationId()).isEqualTo(7L);
    }

    @Test
    void createFromApplication_rejectsNotHiredAndDuplicates() {
        JobApplication shortlisted = JobApplication.builder().stage(ApplicationStage.SHORTLISTED).build();
        when(applications.findById(1L)).thenReturn(Optional.of(shortlisted));
        assertThatThrownBy(() -> service.createFromApplication(1L, new FromApplicationRequest(start), hr))
                .hasMessageContaining("hired");

        JobApplication hired = JobApplication.builder().stage(ApplicationStage.HIRED).build();
        when(applications.findById(2L)).thenReturn(Optional.of(hired));
        when(cases.existsByApplication(hired)).thenReturn(true);
        assertThatThrownBy(() -> service.createFromApplication(2L, new FromApplicationRequest(start), hr))
                .hasMessageContaining("already been started");
        verify(cases, never()).save(any());
    }

    @Test
    void linkUser_tiesAccount_andTicksTheAccountTask() {
        OnboardingCase c = theCase(OnboardingStatus.IN_PROGRESS);
        User account = new User();
        account.setUsername("aobi");
        List<OnboardingTask> list = taskList(c, 3, 0);
        when(cases.findById(1L)).thenReturn(Optional.of(c));
        when(users.findByEmail("aobi@x.com")).thenReturn(Optional.of(account));
        when(tasks.findByOnboardingCaseOrderBySortOrderAsc(c)).thenReturn(list);
        when(staff.findByUser(account)).thenReturn(Optional.empty());
        echoCaseSave();

        OnboardingCaseResponse r = service.linkUser(1L, " aobi@x.com ", hr);

        assertThat(r.linkedUsername()).isEqualTo("aobi");
        assertThat(list.get(0).isDone()).isTrue();
        assertThat(list.get(0).getDoneBy()).isEqualTo("hr");
        assertThat(r.profileReady()).isFalse();
        assertThat(r.payrollReady()).isFalse();
    }

    @Test
    void linkUser_unknownEmail_isRejected() {
        when(cases.findById(1L)).thenReturn(Optional.of(theCase(OnboardingStatus.IN_PROGRESS)));
        when(users.findByEmail("nobody@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.linkUser(1L, "nobody@x.com", hr)).hasMessageContaining("No staff account");
    }

    @Test
    void response_reportsPayrollReadiness_fromTheStaffProfile() {
        OnboardingCase c = theCase(OnboardingStatus.IN_PROGRESS);
        User account = new User();
        account.setUsername("aobi");
        c.setUser(account);
        StaffProfile withGrade = new StaffProfile();
        withGrade.setGradeLevel(10);
        when(cases.findAllByOrderByStartDateDesc()).thenReturn(List.of(c));
        when(tasks.findByOnboardingCaseOrderBySortOrderAsc(c)).thenReturn(taskList(c, 2, 1));
        when(staff.findByUser(account)).thenReturn(Optional.of(withGrade));

        OnboardingCaseResponse r = service.list().get(0);

        assertThat(r.profileReady()).isTrue();
        assertThat(r.payrollReady()).isTrue();
        assertThat(r.tasksDone()).isEqualTo(1);
        assertThat(r.tasksTotal()).isEqualTo(2);
    }

    @Test
    void setTask_completingTheLastTask_completesTheCase() {
        OnboardingCase c = theCase(OnboardingStatus.IN_PROGRESS);
        List<OnboardingTask> list = taskList(c, 2, 1);
        when(tasks.findById(2L)).thenReturn(Optional.of(list.get(1)));
        when(tasks.findByOnboardingCaseOrderBySortOrderAsc(c)).thenReturn(list);

        OnboardingCaseResponse r = service.setTask(2L, true, hr);

        assertThat(r.status()).isEqualTo(OnboardingStatus.COMPLETED);
        verify(cases).save(c);
    }

    @Test
    void setTask_untickingReopensACompletedCase() {
        OnboardingCase c = theCase(OnboardingStatus.COMPLETED);
        List<OnboardingTask> list = taskList(c, 2, 2);
        when(tasks.findById(1L)).thenReturn(Optional.of(list.get(0)));
        when(tasks.findByOnboardingCaseOrderBySortOrderAsc(c)).thenReturn(list);

        OnboardingCaseResponse r = service.setTask(1L, false, hr);

        assertThat(r.status()).isEqualTo(OnboardingStatus.IN_PROGRESS);
        assertThat(list.get(0).getDoneBy()).isNull();
    }

    @Test
    void cancelledCases_rejectFurtherChanges_andCompletedCannotBeCancelled() {
        OnboardingCase cancelled = theCase(OnboardingStatus.CANCELLED);
        OnboardingTask t = taskList(cancelled, 1, 0).get(0);
        when(tasks.findById(1L)).thenReturn(Optional.of(t));
        assertThatThrownBy(() -> service.setTask(1L, true, hr)).hasMessageContaining("cancelled");

        OnboardingCase done = theCase(OnboardingStatus.COMPLETED);
        when(cases.findById(2L)).thenReturn(Optional.of(done));
        assertThatThrownBy(() -> service.cancel(2L, hr)).hasMessageContaining("completed");
    }

    @Test
    void cancel_marksCancelled_andAudits() {
        OnboardingCase c = theCase(OnboardingStatus.IN_PROGRESS);
        when(cases.findById(1L)).thenReturn(Optional.of(c));
        when(tasks.findByOnboardingCaseOrderBySortOrderAsc(c)).thenReturn(List.of());
        echoCaseSave();

        assertThat(service.cancel(1L, hr).status()).isEqualTo(OnboardingStatus.CANCELLED);
        verify(audit).record(eq("hr"), eq("ONBOARDING_CANCELLED"), any(), any(), any());
    }
}
