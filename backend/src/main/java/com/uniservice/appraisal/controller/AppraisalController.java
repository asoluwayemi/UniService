package com.uniservice.appraisal.controller;

import com.uniservice.appraisal.dto.*;
import com.uniservice.appraisal.service.AppraisalService;
import com.uniservice.auth.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appraisals")
@RequiredArgsConstructor
public class AppraisalController {

    private final AppraisalService appraisalService;

    @GetMapping("/mine")
    public AppraisalFormResponse mine(@RequestParam Long cycleId, @AuthenticationPrincipal UserPrincipal principal) {
        return appraisalService.getOrCreateMine(cycleId, principal.getUser());
    }

    @GetMapping("/pending")
    public List<AppraisalSummaryResponse> pending(@AuthenticationPrincipal UserPrincipal principal) {
        return appraisalService.listPendingMyAction(principal.getUser());
    }

    @GetMapping("/staff/{staffProfileId}")
    @PreAuthorize("hasAuthority('APPRAISAL_READ')")
    public List<AppraisalSummaryResponse> forStaff(@PathVariable Long staffProfileId) {
        return appraisalService.listForStaff(staffProfileId);
    }

    @GetMapping("/{id}")
    public AppraisalFormResponse getById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        return appraisalService.getById(id, principal.getUser());
    }

    @PostMapping("/{id}/staff-submit")
    public AppraisalFormResponse staffSubmit(@PathVariable Long id, @RequestBody StaffSubmitBiodataRequest request,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        return appraisalService.submitStaffBiodata(id, request, principal.getUser());
    }

    @PostMapping("/{id}/unit-head-review")
    public AppraisalFormResponse unitHeadReview(@PathVariable Long id, @Valid @RequestBody UnitHeadReviewRequest request,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        return appraisalService.submitUnitHeadReview(id, request, principal.getUser());
    }

    @PostMapping("/{id}/staff-counter-comment")
    public AppraisalFormResponse staffCounterComment(@PathVariable Long id, @RequestBody StaffCounterCommentRequest request,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return appraisalService.submitStaffCounterComment(id, request, principal.getUser());
    }

    @PostMapping("/{id}/department-head-sign")
    public AppraisalFormResponse departmentHeadSign(@PathVariable Long id, @RequestBody DepartmentHeadSignRequest request,
                                                      @AuthenticationPrincipal UserPrincipal principal) {
        return appraisalService.submitDepartmentHeadSignOff(id, request, principal.getUser());
    }
}
