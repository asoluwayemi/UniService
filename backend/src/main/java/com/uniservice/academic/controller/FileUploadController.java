package com.uniservice.academic.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
public class FileUploadController {

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
    public ResponseEntity<UploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
        String fileId = UUID.randomUUID().toString().substring(0, 8);
        String mockUrl = "/uploads/academic/" + fileId + "_" + originalName;

        return ResponseEntity.ok(new UploadResponse(originalName, mockUrl, file.getContentType(), file.getSize()));
    }
}
