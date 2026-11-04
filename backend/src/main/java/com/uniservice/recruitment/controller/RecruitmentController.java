package com.uniservice.recruitment.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.recruitment.dto.*;
import com.uniservice.recruitment.service.RecruitmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recruitment")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('RECRUITMENT_MANAGE')")
public class RecruitmentController {

    private final RecruitmentService service;

    @GetMapping("/postings")
    public List<JobPostingResponse> postings() {
        return service.listPostings();
    }

    @PostMapping("/postings")
    public JobPostingResponse create(@Valid @RequestBody JobPostingRequest r, @AuthenticationPrincipal UserPrincipal p) {
        return service.createPosting(r, p.getUser());
    }

    @PostMapping("/postings/{id}/status")
    public JobPostingResponse setStatus(@PathVariable Long id, @Valid @RequestBody PostingStatusRequest r,
                                        @AuthenticationPrincipal UserPrincipal p) {
        return service.setStatus(id, r.status(), p.getUser());
    }

    @GetMapping("/postings/{id}/applications")
    public List<ApplicationResponse> applications(@PathVariable Long id) {
        return service.applicationsFor(id);
    }

    @PostMapping("/postings/{id}/applications")
    public ApplicationResponse apply(@PathVariable Long id, @Valid @RequestBody ApplicationRequest r,
                                     @AuthenticationPrincipal UserPrincipal p) {
        return service.addApplication(id, r, p.getUser());
    }

    @PostMapping("/applications/{id}/stage")
    public ApplicationResponse stage(@PathVariable Long id, @Valid @RequestBody StageChangeRequest r,
                                     @AuthenticationPrincipal UserPrincipal p) {
        return service.changeStage(id, r, p.getUser());
    }
}
