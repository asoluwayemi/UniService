package com.uniservice.org.controller;

import com.uniservice.auth.dto.UserSummaryResponse;
import com.uniservice.auth.service.UserQueryService;
import com.uniservice.org.dto.OrgUnitResponse;
import com.uniservice.org.service.OrgUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org/units")
@RequiredArgsConstructor
public class OrgUnitController {

    private final OrgUnitService orgUnitService;
    private final UserQueryService userQueryService;

    @GetMapping
    @PreAuthorize("hasAuthority('ORG_READ')")
    public List<OrgUnitResponse> list() {
        return orgUnitService.listAll().stream().map(OrgUnitResponse::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ORG_READ')")
    public OrgUnitResponse getById(@PathVariable Long id) {
        return OrgUnitResponse.from(orgUnitService.getById(id));
    }

    @GetMapping("/assignable-heads")
    @PreAuthorize("hasAuthority('ORG_WRITE')")
    public List<UserSummaryResponse> assignableHeads() {
        return userQueryService.listUsers();
    }
}
