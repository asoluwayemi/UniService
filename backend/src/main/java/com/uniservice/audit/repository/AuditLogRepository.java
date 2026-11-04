package com.uniservice.audit.repository;

import com.uniservice.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
            select a from AuditLog a
            where (:actor is null or lower(a.actor) like lower(concat('%', :actor, '%')))
              and (:action is null or a.action = :action)
            order by a.createdAt desc, a.id desc
            """)
    Page<AuditLog> search(@Param("actor") String actor, @Param("action") String action, Pageable pageable);
}
