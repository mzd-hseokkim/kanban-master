package com.kanban.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceRequest {

    private boolean notifyDueDate;
    private int dueDateBeforeMinutes;
}
