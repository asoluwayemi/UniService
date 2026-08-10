package com.uniservice.org.controller;

import com.uniservice.auth.dto.UserSummaryResponse;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.UserQueryService;
import com.uniservice.org.dto.OrgUnitResponse;
import com.uniservice.org.service.OrgUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org/units")
@RequiredArgsConstructor
public class OrgUnitController {

    private final OrgUnitService orgUnitService;
    private final UserQueryService userQueryService;

    @GetMapping
    @PreAuthorize("(hasAuthority('ORG_READ') and @hrStepUp.verified(authentication)) or hasAuthority('ORG_READ_SUBTREE')")
    public List<OrgUnitResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return orgUnitService.listVisible(principal.getUser()).stream().map(OrgUnitResponse::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("(hasAuthority('ORG_READ') and @hrStepUp.verified(authentication)) or hasAuthority('ORG_READ_SUBTREE')")
    public OrgUnitResponse getById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        return OrgUnitResponse.from(orgUnitService.getVisibleById(id, principal.getUser()));
    }

    @GetMapping("/assignable-heads")
    @PreAuthorize("hasAuthority('ORG_WRITE') and @hrStepUp.verified(authentication)")
    public List<UserSummaryResponse> assignableHeads() {
        return userQueryService.listUsers();
    }
}
