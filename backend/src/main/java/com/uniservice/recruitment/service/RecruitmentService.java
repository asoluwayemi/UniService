package com.uniservice.recruitment.service;

import com.uniservice.audit.service.AuditService;
import com.uniservice.auth.entity.User;
import com.uniservice.recruitment.dto.*;
import com.uniservice.recruitment.entity.*;
import com.uniservice.recruitment.repository.JobApplicationRepository;
import com.uniservice.recruitment.repository.JobPostingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class RecruitmentService {

    private final JobPostingRepository postings;
    private final JobApplicationRepository applications;
    private final AuditService audit;
    private final Clock clock;

    public RecruitmentService(JobPostingRepository postings, JobApplicationRepository applications,
                              AuditService audit, Clock clock) {
        this.postings = postings;
        this.applications = applications;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<JobPostingResponse> listPostings() {
        return postings.findAllByOrderByCreatedAtDesc().stream()
                .map(p -> JobPostingResponse.from(p, applications.countByPosting(p))).toList();
    }

    @Transactional
    public JobPostingResponse createPosting(JobPostingRequest r, User actor) {
        if (r.closingDate() != null && r.closingDate().isBefore(LocalDate.now(clock))) {
            throw new IllegalArgumentException("Closing date cannot be in the past");
        }
        JobPosting saved = postings.save(JobPosting.builder()
                .title(r.title().trim()).department(r.department().trim()).category(r.category())
                .description(r.description().trim()).closingDate(r.closingDate()).build());
        audit.record(actor.getUsername(), "JOB_POSTING_CREATED", "JobPosting", String.valueOf(saved.getId()), saved.getTitle());
        return JobPostingResponse.from(saved, 0);
    }

    @Transactional
    public JobPostingResponse setStatus(Long id, PostingStatus status, User actor) {
        JobPosting posting = findPosting(id);
        if (posting.getStatus() == PostingStatus.CLOSED && status != PostingStatus.CLOSED) {
            throw new IllegalArgumentException("A closed posting cannot be reopened; create a new one");
        }
        posting.setStatus(status);
        JobPosting saved = postings.save(posting);
        audit.record(actor.getUsername(), "JOB_POSTING_" + status.name(), "JobPosting", String.valueOf(id), saved.getTitle());
        return JobPostingResponse.from(saved, applications.countByPosting(saved));
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> applicationsFor(Long postingId) {
        return applications.findByPostingOrderByAppliedAtDesc(findPosting(postingId)).stream()
                .map(ApplicationResponse::from).toList();
    }

    @Transactional
    public ApplicationResponse addApplication(Long postingId, ApplicationRequest r, User actor) {
        JobPosting posting = findPosting(postingId);
        if (posting.getStatus() != PostingStatus.OPEN) {
            throw new IllegalArgumentException("This posting is not open for applications");
        }
        if (posting.getClosingDate() != null && posting.getClosingDate().isBefore(LocalDate.now(clock))) {
            throw new IllegalArgumentException("The closing date for this posting has passed");
        }
        String email = r.email().trim().toLowerCase();
        if (applications.existsByPostingAndEmailIgnoreCase(posting, email)) {
            throw new IllegalArgumentException("An application from " + email + " already exists for this posting");
        }
        JobApplication saved = applications.save(JobApplication.builder()
                .posting(posting).applicantName(r.applicantName().trim()).email(email)
                .phone(r.phone()).coverNote(r.coverNote()).appliedAt(Instant.now(clock)).build());
        audit.record(actor.getUsername(), "APPLICATION_RECEIVED", "JobApplication", String.valueOf(saved.getId()), posting.getTitle());
        return ApplicationResponse.from(saved);
    }

    @Transactional
    public ApplicationResponse changeStage(Long applicationId, StageChangeRequest r, User actor) {
        JobApplication app = applications.findById(applicationId)
                .orElseThrow(() -> new NoSuchElementException("Application not found"));
        if (!app.getStage().next().contains(r.stage())) {
            throw new IllegalArgumentException("Cannot move an application from " + app.getStage() + " to " + r.stage());
        }
        if (r.stage() == ApplicationStage.REJECTED && (r.note() == null || r.note().isBlank())) {
            throw new IllegalArgumentException("A reason is required to reject an application");
        }
        ApplicationStage from = app.getStage();
        app.setStage(r.stage());
        app.setStageNote(r.note());
        JobApplication saved = applications.save(app);
        audit.record(actor.getUsername(), "APPLICATION_" + r.stage().name(), "JobApplication",
                String.valueOf(saved.getId()), from + " -> " + r.stage());
        return ApplicationResponse.from(saved);
    }

    private JobPosting findPosting(Long id) {
        return postings.findById(id).orElseThrow(() -> new NoSuchElementException("Job posting not found"));
    }
}
