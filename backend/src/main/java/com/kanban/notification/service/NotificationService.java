package com.kanban.notification.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.kanban.notification.domain.Notification;
import com.kanban.notification.domain.NotificationType;
import com.kanban.notification.event.NotificationEvent;
import com.kanban.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
@lombok.extern.slf4j.Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final RedisPublisher redisPublisher;

    public Notification createNotification(Long recipientId, NotificationType type, String message,
            String relatedUrl) {
        log.info("[MENTION] Creating notification - Recipient: {}, Type: {}, Message: {}",
                recipientId, type, message);
        Notification notification = Notification.builder().recipientId(recipientId).type(type)
                .message(message).relatedUrl(relatedUrl).isRead(false).build();

        Notification savedNotification;
        try {
            savedNotification = notificationRepository.save(notification);
            log.info("[MENTION] Notification saved to DB. ID: {}, Recipient: {}",
                    savedNotification.getId(), recipientId);
        } catch (Exception e) {
            log.error("[MENTION] Failed to save notification to DB", e);
            throw e;
        }

        // Publish real-time event
        try {
            redisPublisher.publishNotification(NotificationEvent.builder().recipientId(recipientId)
                    .id(savedNotification.getId()).message(message).type(type).actionUrl(relatedUrl)
                    .createdAt(savedNotification.getCreatedAt()).build());
            log.info("[MENTION] Notification event published to Redis for user: {}", recipientId);
        } catch (Exception e) {
            // Log error but do not fail the transaction (ensure notification is saved)
            log.error("[MENTION] Failed to publish notification event", e);
        }

        return savedNotification;
    }

    @Transactional(readOnly = true)
    public List<Notification> getRecentNotifications(Long recipientId) {
        // Unread OR Read within last 24 hours
        return notificationRepository.findRecentNotifications(recipientId,
                java.time.LocalDateTime.now().minusHours(24));
    }

    @Transactional(readOnly = true)
    public List<Notification> getAllNotifications(Long recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setIsRead(true);
        });
    }
}
