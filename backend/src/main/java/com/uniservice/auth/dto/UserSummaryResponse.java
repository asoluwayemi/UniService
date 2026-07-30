package com.uniservice.auth.dto;

import java.util.Set;

public record UserSummaryResponse(Long id, String username, String email, String firstName, String lastName,
                                   boolean enabled, Set<String> roles) {
}
