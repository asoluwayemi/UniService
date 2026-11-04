package com.uniservice.audit.service;

import com.uniservice.audit.dto.AuditPageResponse;
import com.uniservice.audit.entity.AuditLog;
import com.uniservice.audit.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock private AuditLogRepository repository;

    private AuditService service() {
        return new AuditService(repository);
    }

    @Test
    void record_savesEntry() {
        service().record("admin", "USER_CREATED", "User", "5", "roles=STAFF");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(repository).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertThat(saved.getActor()).isEqualTo("admin");
        assertThat(saved.getAction()).isEqualTo("USER_CREATED");
        assertThat(saved.getEntityType()).isEqualTo("User");
        assertThat(saved.getEntityId()).isEqualTo("5");
        assertThat(saved.getDetail()).isEqualTo("roles=STAFF");
    }

    @Test
    void record_blankActorFallsBackToSystem_andLongDetailIsTruncated() {
        service().record(" ", "X", null, null, "d".repeat(2000));

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getActor()).isEqualTo("system");
        assertThat(captor.getValue().getDetail()).hasSize(1000);
    }

    @Test
    void record_neverThrowsWhenPersistenceFails() {
        when(repository.save(any())).thenThrow(new RuntimeException("db down"));

        assertThatCode(() -> service().record("admin", "X", null, null, null)).doesNotThrowAnyException();
    }

    @Test
    void search_normalisesFilters_andClampsPaging() {
        AuditLog log = AuditLog.builder().actor("admin").action("USER_CREATED").build();
        log.setId(1L);
        when(repository.search(eq("admin"), isNull(), any(Pageable.class)))
                .thenReturn((Page<AuditLog>) new PageImpl<>(List.of(log)));

        AuditPageResponse response = service().search("  admin ", "  ", -3, 5000);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).search(eq("admin"), isNull(), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(AuditService.MAX_PAGE_SIZE);
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).actor()).isEqualTo("admin");
        assertThat(response.totalElements()).isEqualTo(1);
    }
}
