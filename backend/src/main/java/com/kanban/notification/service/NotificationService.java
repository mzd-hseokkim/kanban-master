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
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final RedisPublisher redisPublisher;

    public Notification createNotification(Long recipientId, NotificationType type, String message,
            String relatedUrl) {
        Notification notification = Notification.builder().recipientId(recipientId).type(type)
                .message(message).relatedUrl(relatedUrl).isRead(false).build();
        Notification savedNotification = notificationRepository.save(notification);
        System.out.println("Notification saved to DB. ID: " + savedNotification.getId()
                + ", Recipient: " + recipientId);

        // Publish real-time event
        try {
            redisPublisher.publishNotification(NotificationEvent.builder().recipientId(recipientId)
                    .id(savedNotification.getId()).message(message).type(type).actionUrl(relatedUrl)
                    .createdAt(savedNotification.getCreatedAt()).build());
            System.out.println("Notification event published to Redis for user: " + recipientId);
        } catch (Exception e) {
            // Log error but do not fail the transaction (ensure notification is saved)
            // log.error("Failed to publish notification event", e);
            // Assuming Slf4j is available as per class annotation, but let's just catch and
            // continue or print stack trace if log not available in scope (it is not in the snippet
            // I saw, wait, let me check imports)
            // The file has @Slf4j? No, I need to check the file content again.
            // Ah, I saw the file content. It does NOT have @Slf4j.
            // I will add @Slf4j and the import.
            System.err.println("Failed to publish notification event: " + e.getMessage());
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
