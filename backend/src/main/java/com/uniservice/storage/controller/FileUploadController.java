package com.uniservice.storage.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.storage.entity.StoredDocument;
import com.uniservice.storage.service.FileStorageService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UploadResponse {
        private String fileName;
        private String fileUrl;
        private String fileType;
        private long size;
    }

    @PostMapping
    public ResponseEntity<UploadResponse> uploadFile(@RequestParam("file") MultipartFile file,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        StoredDocument document = fileStorageService.store(file, principal.getUser());
        UploadResponse response = new UploadResponse(
                document.getOriginalFilename(),
                "/api/uploads/" + document.getStorageKey(),
                document.getContentType(),
                document.getSizeBytes());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{storageKey}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String storageKey) {
        StoredDocument document = fileStorageService.findMetadata(storageKey);
        Resource resource = fileStorageService.loadAsResource(document);
        MediaType mediaType = document.getContentType() != null
                ? MediaType.parseMediaType(document.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + document.getOriginalFilename() + "\"")
                .body(resource);
    }
}
