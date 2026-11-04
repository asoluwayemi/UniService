package com.uniservice.vault.service;

import com.uniservice.audit.service.AuditService;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.storage.entity.StoredDocument;
import com.uniservice.storage.service.FileStorageService;
import com.uniservice.vault.dto.VaultDocumentResponse;
import com.uniservice.vault.entity.VaultCategory;
import com.uniservice.vault.entity.VaultDocument;
import com.uniservice.vault.repository.VaultDocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VaultServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2027, 3, 10);

    @Mock private VaultDocumentRepository vault;
    @Mock private FileStorageService storage;
    @Mock private UserRepository users;
    @Mock private AuditService audit;

    private VaultService service;
    private User hr;
    private User staff;
    private User other;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(TODAY.atStartOfDay().toInstant(ZoneOffset.UTC), ZoneOffset.UTC);
        service = new VaultService(vault, storage, users, audit, clock);
        hr = user(1L, "hr");
        staff = user(2L, "jdoe");
        other = user(3L, "other");
    }

    private User user(Long id, String name) {
        User u = new User();
        u.setId(id);
        u.setUsername(name);
        u.setFirstName(name);
        u.setLastName("X");
        u.setEmail(name + "@uni.edu");
        return u;
    }

    private VaultDocument doc(Long id, User owner, boolean visible, LocalDate expires) {
        StoredDocument stored = StoredDocument.builder().storageKey("key" + id).originalFilename("c.pdf")
                .contentType("application/pdf").sizeBytes(10).uploadedBy(hr).build();
        VaultDocument d = VaultDocument.builder().owner(owner).storedDocument(stored).category(VaultCategory.CONTRACT)
                .title("Contract").visibleToOwner(visible).expiresOn(expires).build();
        d.setId(id);
        return d;
    }

    private MockMultipartFile file(String name, String type, int size) {
        return new MockMultipartFile("file", name, type, new byte[size]);
    }

    private void stubUpload() {
        when(users.findById(2L)).thenReturn(Optional.of(staff));
        when(storage.store(any(), eq(hr))).thenReturn(
                StoredDocument.builder().storageKey("k").originalFilename("c.pdf").contentType("application/pdf")
                        .sizeBytes(5).uploadedBy(hr).build());
        when(vault.save(any(VaultDocument.class))).thenAnswer(i -> {
            VaultDocument d = i.getArgument(0);
            d.setId(11L);
            return d;
        });
    }

    @Test
    void upload_storesAndAudits_andNeverExposesTheStorageKey() {
        stubUpload();

        VaultDocumentResponse r = service.upload(2L, file("c.pdf", "application/pdf", 5), VaultCategory.CONTRACT,
                " Contract ", " ", TODAY.plusDays(30), true, hr);

        assertThat(r.title()).isEqualTo("Contract");
        assertThat(r.description()).isNull();
        assertThat(r.daysToExpiry()).isEqualTo(30);
        assertThat(r.ownerUsername()).isEqualTo("jdoe");
        assertThat(r.toString()).doesNotContain("storageKey");
        verify(audit).record(eq("hr"), eq("VAULT_DOCUMENT_UPLOADED"), eq("VaultDocument"), eq("11"), any());
    }

    @Test
    void upload_rejectsBadTypes_mismatchedHeaders_oversizeAndEmptyFiles() {
        when(users.findById(2L)).thenReturn(Optional.of(staff));

        assertThatThrownBy(() -> service.upload(2L, file("run.exe", "application/octet-stream", 5), VaultCategory.OTHER, "t", null, null, true, hr))
                .hasMessageContaining("Only PDF");
        // extension says pdf but the declared type says html: reject
        assertThatThrownBy(() -> service.upload(2L, file("a.pdf", "text/html", 5), VaultCategory.OTHER, "t", null, null, true, hr))
                .hasMessageContaining("Only PDF");
        assertThatThrownBy(() -> service.upload(2L, file("noext", "application/pdf", 5), VaultCategory.OTHER, "t", null, null, true, hr))
                .hasMessageContaining("Only PDF");
        assertThatThrownBy(() -> service.upload(2L, file("a.pdf", "application/pdf", 10 * 1024 * 1024 + 1), VaultCategory.OTHER, "t", null, null, true, hr))
                .hasMessageContaining("10MB");
        assertThatThrownBy(() -> service.upload(2L, file("a.pdf", "application/pdf", 0), VaultCategory.OTHER, "t", null, null, true, hr))
                .hasMessageContaining("Choose a file");
        assertThatThrownBy(() -> service.upload(2L, file("a.pdf", "application/pdf", 5), VaultCategory.OTHER, "  ", null, null, true, hr))
                .hasMessageContaining("title");
        verify(storage, never()).store(any(), any());
    }

    @Test
    void upload_unknownStaff_notFound() {
        when(users.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.upload(9L, file("a.pdf", "application/pdf", 5), VaultCategory.OTHER, "t", null, null, true, hr))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void mine_onlyAsksForOwnerVisibleDocuments() {
        when(vault.findByOwnerAndVisibleToOwnerTrueOrderByCreatedAtDesc(staff)).thenReturn(List.of(doc(1L, staff, true, null)));

        assertThat(service.mine(staff)).hasSize(1);
        verify(vault, never()).findByOwnerOrderByCreatedAtDesc(any());
    }

    @Test
    void download_ownerGetsOwnVisibleDocument_withoutAudit() {
        VaultDocument d = doc(1L, staff, true, null);
        when(vault.findById(1L)).thenReturn(Optional.of(d));
        when(storage.loadAsResource(d.getStoredDocument())).thenReturn(new ByteArrayResource(new byte[1]));

        assertThat(service.download(1L, staff, false).resource()).isNotNull();
        verify(audit, never()).record(any(), any(), any(), any(), any());
    }

    @Test
    void download_ownerCannotSeeHrOnlyDocument_orSomeoneElses_andErrorLooksLikeMissing() {
        when(vault.findById(1L)).thenReturn(Optional.of(doc(1L, staff, false, null)));
        when(vault.findById(2L)).thenReturn(Optional.of(doc(2L, staff, true, null)));

        assertThatThrownBy(() -> service.download(1L, staff, false)).isInstanceOf(NoSuchElementException.class);
        assertThatThrownBy(() -> service.download(2L, other, false)).isInstanceOf(NoSuchElementException.class);
        verify(storage, never()).loadAsResource(any());
    }

    @Test
    void download_managerReadingSomeoneElsesDocumentIsAudited_evenWhenHrOnly() {
        VaultDocument d = doc(1L, staff, false, null);
        when(vault.findById(1L)).thenReturn(Optional.of(d));
        when(storage.loadAsResource(d.getStoredDocument())).thenReturn(new ByteArrayResource(new byte[1]));

        service.download(1L, hr, true);

        verify(audit).record(eq("hr"), eq("VAULT_DOCUMENT_ACCESSED"), eq("VaultDocument"), eq("1"), any());
    }

    @Test
    void delete_removesRecordAndFile_andAudits() {
        VaultDocument d = doc(1L, staff, true, null);
        when(vault.findById(1L)).thenReturn(Optional.of(d));

        service.delete(1L, hr);

        verify(vault).delete(d);
        verify(storage).delete(d.getStoredDocument());
        verify(audit).record(eq("hr"), eq("VAULT_DOCUMENT_DELETED"), any(), eq("1"), any());
    }

    @Test
    void expiring_clampsTheWindow() {
        when(vault.findByExpiresOnBetweenOrderByExpiresOnAsc(TODAY, TODAY.plusDays(365)))
                .thenReturn(List.of(doc(1L, staff, true, TODAY.plusDays(5))));

        List<VaultDocumentResponse> r = service.expiring(100000);

        assertThat(r).hasSize(1);
        assertThat(r.get(0).daysToExpiry()).isEqualTo(5);
    }

    @Test
    void lookup_findsByEmail_orFails() {
        when(users.findByEmail("jdoe@uni.edu")).thenReturn(Optional.of(staff));
        assertThat(service.lookup(" jdoe@uni.edu ").userId()).isEqualTo(2L);

        when(users.findByEmail("no@uni.edu")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.lookup("no@uni.edu")).isInstanceOf(NoSuchElementException.class);
    }
}
