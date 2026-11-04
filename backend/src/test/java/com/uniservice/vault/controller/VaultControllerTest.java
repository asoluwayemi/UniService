package com.uniservice.vault.controller;

import com.uniservice.auth.config.JwtAuthenticationEntryPoint;
import com.uniservice.auth.config.JwtAuthenticationFilter;
import com.uniservice.auth.config.SecurityConfig;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.auth.service.JwtService;
import com.uniservice.storage.entity.StoredDocument;
import com.uniservice.vault.service.VaultService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VaultController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class VaultControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private VaultService service;
    @MockBean private JwtService jwtService;
    @MockBean private UserDetailsService userDetailsService;

    private UsernamePasswordAuthenticationToken authAs(String authority) {
        User user = new User();
        user.setId(1L);
        user.setUsername("u");
        return new UsernamePasswordAuthenticationToken(UserPrincipal.of(user), null, List.of(new SimpleGrantedAuthority(authority)));
    }

    @Test
    void download_isAnAttachmentWithNosniff_andManagerFlagComesFromTheAuthority() throws Exception {
        StoredDocument stored = StoredDocument.builder().originalFilename("c.pdf").contentType("application/pdf").build();
        when(service.download(eq(5L), any(), anyBoolean()))
                .thenReturn(new VaultService.Download(stored, new ByteArrayResource(new byte[]{1})));

        mockMvc.perform(get("/api/vault/documents/5/download").with(authentication(authAs("VAULT_MANAGE"))))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("attachment")))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        verify(service).download(eq(5L), any(), eq(true));

        mockMvc.perform(get("/api/vault/documents/5/download").with(authentication(authAs("STAFF"))))
                .andExpect(status().isOk());
        verify(service).download(eq(5L), any(), eq(false));
    }

    @Test
    void ownDocuments_availableToAnyAuthenticatedUser() throws Exception {
        when(service.mine(any())).thenReturn(List.of());
        mockMvc.perform(get("/api/vault/me").with(authentication(authAs("STAFF")))).andExpect(status().isOk());
    }

    @Test
    void managementEndpoints_forbiddenWithoutPermission() throws Exception {
        var staff = authentication(authAs("STAFF"));
        mockMvc.perform(get("/api/vault/lookup?email=a@b.c").with(staff)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/vault/staff/2").with(staff)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/vault/expiring").with(staff)).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/vault/documents/1").with(staff)).andExpect(status().isForbidden());
        mockMvc.perform(multipart("/api/vault/staff/2").file(new MockMultipartFile("file", "a.pdf", "application/pdf", new byte[1]))
                        .param("category", "CONTRACT").param("title", "t").with(staff))
                .andExpect(status().isForbidden());
    }

    @Test
    void upload_acceptedForManagers() throws Exception {
        mockMvc.perform(multipart("/api/vault/staff/2").file(new MockMultipartFile("file", "a.pdf", "application/pdf", new byte[1]))
                        .param("category", "CONTRACT").param("title", "t").with(authentication(authAs("VAULT_MANAGE"))))
                .andExpect(status().isOk());
    }

    @Test
    void unauthenticated_isRejected() throws Exception {
        mockMvc.perform(get("/api/vault/me")).andExpect(status().isUnauthorized());
    }
}
