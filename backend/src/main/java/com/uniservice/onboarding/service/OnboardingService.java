package com.uniservice.onboarding.service;

import com.uniservice.audit.service.AuditService;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.onboarding.dto.*;
import com.uniservice.onboarding.entity.*;
import com.uniservice.onboarding.repository.OnboardingCaseRepository;
import com.uniservice.onboarding.repository.OnboardingTaskRepository;
import com.uniservice.recruitment.entity.ApplicationStage;
import com.uniservice.recruitment.entity.JobApplication;
import com.uniservice.recruitment.repository.JobApplicationRepository;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.StaffProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class OnboardingService {

    /** The standard checklist every new hire starts with: {title, owner team}. */
    static final List<String[]> TEMPLATE = List.of(
            new String[]{"Create the staff account (Staff Registration)", "HR"},
            new String[]{"Collect certificates, ID and referee details", "HR"},
            new String[]{"Complete the staff profile (staff number, bank, NIN, TIN)", "HR"},
            new String[]{"Assign grade level, so payroll can include them", "HR"},
            new String[]{"Issue staff ID card", "HR"},
            new String[]{"Set up institutional email and system access", "IT"},
            new String[]{"Add to payroll and confirm bank details", "FINANCE"},
            new String[]{"Orientation and introduction to the department", "DEPARTMENT"},
            new String[]{"Schedule probation review", "HR"});

    private final OnboardingCaseRepository cases;
    private final OnboardingTaskRepository tasks;
    private final JobApplicationRepository applications;
    private final UserRepository users;
    private final StaffProfileRepository staff;
    private final AuditService audit;
    private final Clock clock;

    public OnboardingService(OnboardingCaseRepository cases, OnboardingTaskRepository tasks,
                             JobApplicationRepository applications, UserRepository users,
                             StaffProfileRepository staff, AuditService audit, Clock clock) {
        this.cases = cases;
        this.tasks = tasks;
        this.applications = applications;
        this.users = users;
        this.staff = staff;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<OnboardingCaseResponse> list() {
        return cases.findAllByOrderByStartDateDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public OnboardingCaseResponse create(OnboardingCaseRequest r, User actor) {
        OnboardingCase saved = cases.save(OnboardingCase.builder()
                .newHireName(r.newHireName().trim()).email(r.email().trim().toLowerCase())
                .position(r.position().trim()).department(r.department().trim()).startDate(r.startDate()).build());
        seedTasks(saved);
        audit.record(actor.getUsername(), "ONBOARDING_STARTED", "OnboardingCase", String.valueOf(saved.getId()), saved.getNewHireName());
        return toResponse(saved);
    }

    @Transactional
    public OnboardingCaseResponse createFromApplication(Long applicationId, FromApplicationRequest r, User actor) {
        JobApplication app = applications.findById(applicationId)
                .orElseThrow(() -> new NoSuchElementException("Application not found"));
        if (app.getStage() != ApplicationStage.HIRED) {
            throw new IllegalArgumentException("Only hired applicants can be onboarded");
        }
        if (cases.existsByApplication(app)) {
            throw new IllegalArgumentException("Onboarding has already been started for this applicant");
        }
        OnboardingCase saved = cases.save(OnboardingCase.builder()
                .newHireName(app.getApplicantName()).email(app.getEmail())
                .position(app.getPosting().getTitle()).department(app.getPosting().getDepartment())
                .startDate(r.startDate()).application(app).build());
        seedTasks(saved);
        audit.record(actor.getUsername(), "ONBOARDING_STARTED", "OnboardingCase", String.valueOf(saved.getId()),
                saved.getNewHireName() + " (from application " + applicationId + ")");
        return toResponse(saved);
    }

    /** Links the staff account HR created for this hire; the "create account" task is ticked automatically. */
    @Transactional
    public OnboardingCaseResponse linkUser(Long caseId, String email, User actor) {
        OnboardingCase c = findCase(caseId);
        requireInProgress(c);
        User user = users.findByEmail(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("No staff account found with email " + email.trim()));
        c.setUser(user);
        cases.save(c);
        tasks.findByOnboardingCaseOrderBySortOrderAsc(c).stream().findFirst().ifPresent(t -> markDone(t, true, actor));
        audit.record(actor.getUsername(), "ONBOARDING_ACCOUNT_LINKED", "OnboardingCase", String.valueOf(caseId), user.getUsername());
        return refreshStatus(c);
    }

    @Transactional
    public OnboardingCaseResponse setTask(Long taskId, boolean done, User actor) {
        OnboardingTask task = tasks.findById(taskId).orElseThrow(() -> new NoSuchElementException("Task not found"));
        OnboardingCase c = task.getOnboardingCase();
        if (c.getStatus() == OnboardingStatus.CANCELLED) {
            throw new IllegalArgumentException("This onboarding case was cancelled");
        }
        markDone(task, done, actor);
        return refreshStatus(c);
    }

    @Transactional
    public OnboardingCaseResponse cancel(Long caseId, User actor) {
        OnboardingCase c = findCase(caseId);
        if (c.getStatus() == OnboardingStatus.COMPLETED) {
            throw new IllegalArgumentException("A completed onboarding cannot be cancelled");
        }
        c.setStatus(OnboardingStatus.CANCELLED);
        cases.save(c);
        audit.record(actor.getUsername(), "ONBOARDING_CANCELLED", "OnboardingCase", String.valueOf(caseId), c.getNewHireName());
        return toResponse(c);
    }

    private void markDone(OnboardingTask task, boolean done, User actor) {
        if (task.isDone() == done) return;
        task.setDone(done);
        task.setDoneAt(done ? Instant.now(clock) : null);
        task.setDoneBy(done ? actor.getUsername() : null);
        tasks.save(task);
    }

    /** All tasks done => COMPLETED; un-ticking a task reopens a completed case. */
    private OnboardingCaseResponse refreshStatus(OnboardingCase c) {
        List<OnboardingTask> all = tasks.findByOnboardingCaseOrderBySortOrderAsc(c);
        boolean allDone = !all.isEmpty() && all.stream().allMatch(OnboardingTask::isDone);
        OnboardingStatus target = allDone ? OnboardingStatus.COMPLETED : OnboardingStatus.IN_PROGRESS;
        if (c.getStatus() != target) {
            c.setStatus(target);
            cases.save(c);
        }
        return toResponse(c);
    }

    private void seedTasks(OnboardingCase c) {
        for (int i = 0; i < TEMPLATE.size(); i++) {
            tasks.save(OnboardingTask.builder().onboardingCase(c).sortOrder(i)
                    .title(TEMPLATE.get(i)[0]).ownerTeam(TEMPLATE.get(i)[1]).build());
        }
    }

    private OnboardingCase findCase(Long id) {
        return cases.findById(id).orElseThrow(() -> new NoSuchElementException("Onboarding case not found"));
    }

    private void requireInProgress(OnboardingCase c) {
        if (c.getStatus() == OnboardingStatus.CANCELLED) {
            throw new IllegalArgumentException("This onboarding case was cancelled");
        }
    }

    private OnboardingCaseResponse toResponse(OnboardingCase c) {
        List<OnboardingTaskResponse> taskResponses = tasks.findByOnboardingCaseOrderBySortOrderAsc(c).stream()
                .map(OnboardingTaskResponse::from).toList();
        Optional<StaffProfile> profile = c.getUser() == null ? Optional.empty() : staff.findByUser(c.getUser());
        boolean profileReady = profile.isPresent();
        boolean payrollReady = profile.map(p -> p.getGradeLevel() != null).orElse(false);
        return OnboardingCaseResponse.from(c, taskResponses, profileReady, payrollReady);
    }
}
