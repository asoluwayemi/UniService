package com.uniservice.notification.service;

import com.uniservice.auth.entity.User;
import com.uniservice.notification.entity.Notification;
import com.uniservice.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository repository;

    private NotificationService service;

    private User owner;

    @BeforeEach
    void setUp() {
        service = new NotificationService(repository);
        owner = new User();
        owner.setId(1L);
        owner.setUsername("jdoe");
    }

    @Test
    void unreadCount_delegatesToRepository() {
        when(repository.countByRecipientAndReadFalse(owner)).thenReturn(3L);

        assertThat(service.unreadCount(owner)).isEqualTo(3L);
    }

    @Test
    void markRead_marksNotificationRead_whenOwnedByCaller() {
        Notification notification = Notification.builder().recipient(owner).message("hi").read(false).build();
        notification.setId(9L);
        when(repository.findById(9L)).thenReturn(Optional.of(notification));

        service.markRead(9L, owner);

        assertThat(notification.isRead()).isTrue();
        verify(repository).save(notification);
    }

    @Test
    void markRead_throwsAccessDenied_whenNotOwnedByCaller() {
        User someoneElse = new User();
        someoneElse.setId(2L);
        Notification notification = Notification.builder().recipient(someoneElse).message("hi").read(false).build();
        notification.setId(9L);
        when(repository.findById(9L)).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> service.markRead(9L, owner))
                .isInstanceOf(AccessDeniedException.class);

        verify(repository, never()).save(any());
    }
}
