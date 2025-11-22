package com.kanban.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.kanban.card.Card;
import com.kanban.notification.domain.NotificationType;
import com.kanban.user.User;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    boolean existsByCardAndUserAndNotificationType(Card card, User user,
            NotificationType notificationType);

    void deleteByCardAndNotificationType(Card card, NotificationType notificationType);
}
