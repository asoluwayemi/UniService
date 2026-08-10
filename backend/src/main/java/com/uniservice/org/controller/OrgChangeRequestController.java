package com.uniservice.org.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.org.dto.ChangeRequestResponse;
import com.uniservice.org.dto.ReviewRequest;
import com.uniservice.org.dto.SubmitChangeRequestRequest;
import com.uniservice.org.service.OrgChangeRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org/change-requests")
@RequiredArgsConstructor
public class OrgChangeRequestController {

    private final OrgChangeRequestService changeRequestService;

    @PostMapping
    @PreAuthorize("hasAuthority('ORG_WRITE') and @hrStepUp.verified(authentication)")
    public ChangeRequestResponse submit(@Valid @RequestBody SubmitChangeRequestRequest request,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        return ChangeRequestResponse.from(changeRequestService.submit(request, principal.getUser()));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAuthority('ORG_WRITE') and @hrStepUp.verified(authentication)")
    public List<ChangeRequestResponse> mine(@AuthenticationPrincipal UserPrincipal principal) {
        return changeRequestService.listMine(principal.getUser()).stream().map(ChangeRequestResponse::from).toList();
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') and @hrStepUp.verified(authentication)")
    public List<ChangeRequestResponse> pending() {
        return changeRequestService.listPending().stream().map(ChangeRequestResponse::from).toList();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') and @hrStepUp.verified(authentication)")
    public ChangeRequestResponse approve(@PathVariable Long id, @RequestBody(required = false) ReviewRequest request,
                                         @AuthenticationPrincipal UserPrincipal principal) {
        String notes = request != null ? request.getNotes() : null;
        return ChangeRequestResponse.from(changeRequestService.approve(id, principal.getUser(), notes));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') and @hrStepUp.verified(authentication)")
    public ChangeRequestResponse reject(@PathVariable Long id, @RequestBody ReviewRequest request,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        return ChangeRequestResponse.from(changeRequestService.reject(id, principal.getUser(), request.getNotes()));
    }
}
