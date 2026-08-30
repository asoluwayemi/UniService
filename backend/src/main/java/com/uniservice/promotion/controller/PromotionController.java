package com.uniservice.promotion.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.promotion.dto.*;
import com.uniservice.promotion.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/promotions") @RequiredArgsConstructor
public class PromotionController {
    private final PromotionService service;

    @GetMapping("/eligibility") public PromotionEligibilityResponse eligibility(@AuthenticationPrincipal UserPrincipal principal) { return service.eligibility(principal.getUser()); }
    @GetMapping("/mine") public List<PromotionApplicationResponse> mine(@AuthenticationPrincipal UserPrincipal principal) { return service.mine(principal.getUser()); }
    @PostMapping public PromotionApplicationResponse apply(@Valid @RequestBody CreatePromotionApplicationRequest request, @AuthenticationPrincipal UserPrincipal principal) { return service.apply(request, principal.getUser()); }

    @GetMapping
    @PreAuthorize("hasAuthority('PROMOTION_MANAGE')")
    public List<PromotionSummaryResponse> listAll() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    public PromotionApplicationResponse getById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        boolean canManage = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("PROMOTION_MANAGE"));
        return service.getById(id, principal.getUser(), canManage);
    }

    @PostMapping("/{id}/request-documents")
    @PreAuthorize("hasAuthority('PROMOTION_MANAGE')")
    public PromotionApplicationResponse requestMoreDocuments(@PathVariable Long id, @RequestBody PromotionCommentRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return service.requestMoreDocuments(id, request, principal.getUser());
    }

    @PostMapping("/{id}/verify-documents")
    @PreAuthorize("hasAuthority('PROMOTION_MANAGE')")
    public PromotionApplicationResponse verifyDocuments(@PathVariable Long id, @RequestBody PromotionCommentRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return service.verifyDocuments(id, request, principal.getUser());
    }

    @PostMapping("/{id}/schedule-exam")
    @PreAuthorize("hasAuthority('PROMOTION_MANAGE')")
    public PromotionApplicationResponse scheduleExam(@PathVariable Long id, @Valid @RequestBody SchedulePromotionExamRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return service.scheduleExam(id, request, principal.getUser());
    }

    @PostMapping("/{id}/schedule-interview")
    @PreAuthorize("hasAuthority('PROMOTION_MANAGE')")
    public PromotionApplicationResponse scheduleInterview(@PathVariable Long id, @Valid @RequestBody SchedulePromotionInterviewRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return service.scheduleInterview(id, request, principal.getUser());
    }

    @PostMapping("/{id}/recommend")
    @PreAuthorize("hasAuthority('PROMOTION_MANAGE')")
    public PromotionApplicationResponse recommend(@PathVariable Long id, @RequestBody PromotionCommentRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return service.recommend(id, request, principal.getUser());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('PROMOTION_MANAGE')")
    public PromotionApplicationResponse approve(@PathVariable Long id, @RequestBody PromotionCommentRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return service.approve(id, request, principal.getUser());
    }

    @PostMapping("/{id}/gazette")
    @PreAuthorize("hasAuthority('PROMOTION_MANAGE')")
    public PromotionApplicationResponse gazette(@PathVariable Long id, @RequestBody PromotionCommentRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return service.gazette(id, request, principal.getUser());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('PROMOTION_MANAGE')")
    public PromotionApplicationResponse reject(@PathVariable Long id, @RequestBody PromotionCommentRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return service.reject(id, request, principal.getUser());
    }
}
