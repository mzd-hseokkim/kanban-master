package com.kanban.notification;

import java.time.LocalDateTime;
import com.kanban.card.Card;
import com.kanban.entity.BaseEntity;
import com.kanban.notification.domain.NotificationType;
import com.kanban.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_log",
        indexes = {@Index(name = "idx_notification_log_card_user_type",
                columnList = "card_id, user_id, notification_type")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private NotificationType notificationType;

    @Column(nullable = false)
    private LocalDateTime sentAt;
}
