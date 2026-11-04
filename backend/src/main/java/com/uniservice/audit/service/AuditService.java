package com.uniservice.audit.service;

import com.uniservice.audit.dto.AuditLogResponse;
import com.uniservice.audit.dto.AuditPageResponse;
import com.uniservice.audit.entity.AuditLog;
import com.uniservice.audit.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    static final int MAX_PAGE_SIZE = 100;
    private static final int MAX_DETAIL = 1000;

    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    /**
     * Appends an audit entry. Runs in its own transaction and never throws, so a failure to
     * write the trail can never break (or roll back) the business action being audited.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String actor, String action, String entityType, String entityId, String detail) {
        try {
            repository.save(AuditLog.builder()
                    .actor(actor == null || actor.isBlank() ? "system" : actor)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .detail(detail != null && detail.length() > MAX_DETAIL ? detail.substring(0, MAX_DETAIL) : detail)
                    .build());
        } catch (RuntimeException ignored) {
            // intentionally swallowed: auditing is best-effort
        }
    }

    @Transactional(readOnly = true)
    public AuditPageResponse search(String actor, String action, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Page<AuditLog> result = repository.search(blankToNull(actor), blankToNull(action), PageRequest.of(safePage, safeSize));
        return new AuditPageResponse(
                result.getContent().stream().map(AuditLogResponse::from).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
