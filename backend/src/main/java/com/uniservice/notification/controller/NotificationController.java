package com.uniservice.notification.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.notification.dto.NotificationResponse;
import com.uniservice.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> mine(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.listMine(principal.getUser()).stream().map(NotificationResponse::from).toList();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return Map.of("count", notificationService.unreadCount(principal.getUser()));
    }

    @PostMapping("/{id}/read")
    public void markRead(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markRead(id, principal.getUser());
    }

    @GetMapping("/preferences")
    public Map<String, Boolean> getPreferences(@AuthenticationPrincipal UserPrincipal principal) {
        return Map.of("enabled", notificationService.getPreference(principal.getUser()));
    }

    @PutMapping("/preferences")
    public Map<String, Boolean> updatePreferences(@RequestBody Map<String, Boolean> body,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        return Map.of("enabled", notificationService.updatePreference(principal.getUser(), enabled));
    }
}
