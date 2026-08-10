package com.uniservice.hr.security;

import com.uniservice.auth.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Referenced from @PreAuthorize SpEL as @hrStepUp.verified(authentication), consistent
 * with this codebase's convention of keeping authorization in @PreAuthorize annotations.
 */
@Component("hrStepUp")
public class HrStepUpGuard {

    public boolean verified(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return false;
        }
        Instant expiresAt = principal.getUser().getHrStepUpExpiresAt();
        return expiresAt != null && expiresAt.isAfter(Instant.now());
    }
}
