package com.uniservice.vault.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.vault.dto.StaffLookupResponse;
import com.uniservice.vault.dto.VaultDocumentResponse;
import com.uniservice.vault.entity.VaultCategory;
import com.uniservice.vault.service.VaultService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/vault")
@RequiredArgsConstructor
public class VaultController {

    private final VaultService service;

    @GetMapping("/me")
    public List<VaultDocumentResponse> mine(@AuthenticationPrincipal UserPrincipal p) {
        return service.mine(p.getUser());
    }

    @GetMapping("/lookup")
    @PreAuthorize("hasAuthority('VAULT_MANAGE')")
    public StaffLookupResponse lookup(@RequestParam String email) {
        return service.lookup(email);
    }

    @GetMapping("/staff/{userId}")
    @PreAuthorize("hasAuthority('VAULT_MANAGE')")
    public List<VaultDocumentResponse> forStaff(@PathVariable Long userId) {
        return service.forStaff(userId);
    }

    @PostMapping(value = "/staff/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('VAULT_MANAGE')")
    public VaultDocumentResponse upload(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam VaultCategory category,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiresOn,
            @RequestParam(defaultValue = "true") boolean visibleToOwner,
            @AuthenticationPrincipal UserPrincipal p) {
        return service.upload(userId, file, category, title, description, expiresOn, visibleToOwner, p.getUser());
    }

    @GetMapping("/expiring")
    @PreAuthorize("hasAuthority('VAULT_MANAGE')")
    public List<VaultDocumentResponse> expiring(@RequestParam(defaultValue = "60") int days) {
        return service.expiring(days);
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource> download(
            @PathVariable Long id, @AuthenticationPrincipal UserPrincipal p, Authentication authentication) {
        boolean manager = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("VAULT_MANAGE"));
        VaultService.Download d = service.download(id, p.getUser(), manager);
        MediaType type = d.document().getContentType() != null
                ? MediaType.parseMediaType(d.document().getContentType()) : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(d.document().getOriginalFilename()).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(d.resource());
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasAuthority('VAULT_MANAGE')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal p) {
        service.delete(id, p.getUser());
        return ResponseEntity.noContent().build();
    }
}
