package com.kanban.notification.event;

import java.io.Serializable;
import java.time.LocalDateTime;
import com.kanban.notification.domain.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent implements Serializable {
    private Long recipientId;
    private Long id;
    private String message;
    private NotificationType type;
    private String actionUrl;
    private LocalDateTime createdAt;
}
