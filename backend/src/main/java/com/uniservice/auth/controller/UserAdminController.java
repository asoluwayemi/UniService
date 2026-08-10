package com.uniservice.auth.controller;

import com.uniservice.auth.dto.CreateUserRequest;
import com.uniservice.auth.dto.UserSummaryResponse;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.UserAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserAdminService userAdminService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('USER_MANAGE','HR_USER_MANAGE') and @hrStepUp.verified(authentication)")
    public UserSummaryResponse create(@Valid @RequestBody CreateUserRequest request,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        return userAdminService.createUser(request, principal.getUser());
    }
}
