package com.uniservice.storage.service;

import com.uniservice.auth.entity.User;
import com.uniservice.storage.entity.StoredDocument;
import com.uniservice.storage.repository.StoredDocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Path;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceTest {

    @Mock private StoredDocumentRepository repository;

    private FileStorageService service;

    private User uploader;

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        service = new FileStorageService(repository);
        ReflectionTestUtils.setField(service, "uploadsDir", tempDir.toString());

        uploader = new User();
        uploader.setId(1L);
        uploader.setUsername("jdoe");
    }

    @Test
    void store_thenLoad_roundTripsFileContent() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "manuscript.pdf", "application/pdf", "hello world".getBytes());
        when(repository.save(any(StoredDocument.class))).thenAnswer(inv -> {
            StoredDocument d = inv.getArgument(0);
            d.setId(1L);
            return d;
        });

        StoredDocument stored = service.store(file, uploader);

        assertThat(stored.getOriginalFilename()).isEqualTo("manuscript.pdf");
        assertThat(stored.getContentType()).isEqualTo("application/pdf");
        assertThat(stored.getSizeBytes()).isEqualTo(11);
        assertThat(stored.getUploadedBy()).isEqualTo(uploader);

        Resource resource = service.loadAsResource(stored);
        try (var in = resource.getInputStream()) {
            assertThat(in.readAllBytes()).isEqualTo("hello world".getBytes());
        }
    }

    @Test
    void store_emptyFile_throws() {
        MockMultipartFile empty = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> service.store(empty, uploader))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void findMetadata_unknownKey_throws() {
        when(repository.findByStorageKey("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findMetadata("missing"))
                .isInstanceOf(NoSuchElementException.class);
    }
}
