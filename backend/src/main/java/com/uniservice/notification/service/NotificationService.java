package com.uniservice.notification.service;

import com.uniservice.auth.entity.User;
import com.uniservice.notification.entity.Notification;
import com.uniservice.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;

    public Notification notify(User recipient, String message, String link) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(message)
                .link(link)
                .read(false)
                .build();
        return repository.save(notification);
    }

    public List<Notification> listMine(User user) {
        return repository.findByRecipientOrderByCreatedAtDesc(user);
    }

    public long unreadCount(User user) {
        return repository.countByRecipientAndReadFalse(user);
    }

    public void markRead(Long notificationId, User user) {
        Notification notification = repository.findById(notificationId).orElseThrow();
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new AccessDeniedException("This notification does not belong to you");
        }
        notification.setRead(true);
        repository.save(notification);
    }
}
