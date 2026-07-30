package com.uniservice.staff.controller;

import com.uniservice.auth.dto.UserSummaryResponse;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.staff.dto.*;
import com.uniservice.staff.service.StaffProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffProfileController {

    private final StaffProfileService staffProfileService;

    @GetMapping
    @PreAuthorize("hasAuthority('STAFF_READ')")
    public List<StaffProfileSummaryResponse> list() {
        return staffProfileService.listAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('STAFF_READ')")
    public StaffProfileResponse getById(@PathVariable Long id) {
        return staffProfileService.getById(id);
    }

    @GetMapping("/me")
    public StaffProfileResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return staffProfileService.getMine(principal.getUser());
    }

    @GetMapping("/eligible-users")
    @PreAuthorize("hasAuthority('STAFF_WRITE')")
    public List<UserSummaryResponse> eligibleUsers() {
        return staffProfileService.listEligibleUsers();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('STAFF_WRITE')")
    public StaffProfileResponse create(@Valid @RequestBody CreateStaffProfileRequest request) {
        return staffProfileService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('STAFF_WRITE')")
    public StaffProfileResponse update(@PathVariable Long id, @Valid @RequestBody UpdateStaffProfileRequest request) {
        return staffProfileService.update(id, request);
    }

    @PostMapping("/{id}/qualifications")
    @PreAuthorize("hasAuthority('STAFF_WRITE')")
    public StaffProfileResponse addQualification(@PathVariable Long id, @Valid @RequestBody AddQualificationRequest request) {
        return staffProfileService.addQualification(id, request);
    }

    @DeleteMapping("/{id}/qualifications/{qualificationId}")
    @PreAuthorize("hasAuthority('STAFF_WRITE')")
    public StaffProfileResponse removeQualification(@PathVariable Long id, @PathVariable Long qualificationId) {
        return staffProfileService.removeQualification(id, qualificationId);
    }

    @PostMapping("/{id}/employment-history")
    @PreAuthorize("hasAuthority('STAFF_WRITE')")
    public StaffProfileResponse addEmploymentHistory(@PathVariable Long id, @Valid @RequestBody AddEmploymentHistoryRequest request) {
        return staffProfileService.addEmploymentHistory(id, request);
    }

    @DeleteMapping("/{id}/employment-history/{historyId}")
    @PreAuthorize("hasAuthority('STAFF_WRITE')")
    public StaffProfileResponse removeEmploymentHistory(@PathVariable Long id, @PathVariable Long historyId) {
        return staffProfileService.removeEmploymentHistory(id, historyId);
    }
}
