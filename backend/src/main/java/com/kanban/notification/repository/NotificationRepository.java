package com.kanban.notification.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.kanban.notification.domain.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(Long recipientId);

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    @org.springframework.data.jpa.repository.Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId AND (n.isRead = false OR n.createdAt >= :since) ORDER BY n.createdAt DESC")
    List<Notification> findRecentNotifications(
            @org.springframework.data.repository.query.Param("recipientId") Long recipientId,
            @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
