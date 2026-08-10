package com.uniservice.promotion.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.promotion.dto.*;
import com.uniservice.promotion.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/promotions") @RequiredArgsConstructor
public class PromotionController {
    private final PromotionService service;
    @GetMapping("/eligibility") public PromotionEligibilityResponse eligibility(@AuthenticationPrincipal UserPrincipal principal) { return service.eligibility(principal.getUser()); }
    @GetMapping("/mine") public List<PromotionApplicationResponse> mine(@AuthenticationPrincipal UserPrincipal principal) { return service.mine(principal.getUser()); }
    @PostMapping public PromotionApplicationResponse apply(@Valid @RequestBody CreatePromotionApplicationRequest request, @AuthenticationPrincipal UserPrincipal principal) { return service.apply(request, principal.getUser()); }
}
