package com.kanban.notification.dto;

import java.time.LocalDateTime;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InboxItemDTO {
    private String id; // Unique ID for frontend key (e.g., "inv-1", "notif-2")
    private String type; // "INVITATION" or "NOTIFICATION"
    private String title;
    private String message;
    private String actionUrl;
    private LocalDateTime createdAt;
    @JsonProperty("isRead")
    private boolean isRead;
    private Map<String, Object> payload; // Flexible payload (e.g., invitation token)
}
