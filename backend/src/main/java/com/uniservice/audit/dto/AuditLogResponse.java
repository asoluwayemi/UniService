package com.uniservice.audit.dto;

import com.uniservice.audit.entity.AuditLog;

import java.time.Instant;

public record AuditLogResponse(
        Long id, String actor, String action, String entityType, String entityId, String detail, Instant createdAt) {
    public static AuditLogResponse from(AuditLog a) {
        return new AuditLogResponse(a.getId(), a.getActor(), a.getAction(), a.getEntityType(),
                a.getEntityId(), a.getDetail(), a.getCreatedAt());
    }
}
