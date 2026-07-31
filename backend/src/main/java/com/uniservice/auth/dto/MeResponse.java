package com.uniservice.auth.dto;

import java.time.Instant;
import java.util.Set;

public record MeResponse(Long id, String username, String email, String firstName, String lastName,
                          Set<String> roles, Set<String> permissions,
                          boolean totpEnabled, Instant hrStepUpExpiresAt) {
}
