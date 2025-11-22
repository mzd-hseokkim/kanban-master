package com.kanban.notification.dto;

import com.kanban.notification.NotificationPreference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceResponse {

    private boolean notifyDueDate;
    private int dueDateBeforeMinutes;

    public static NotificationPreferenceResponse from(NotificationPreference preference) {
        return NotificationPreferenceResponse.builder().notifyDueDate(preference.isNotifyDueDate())
                .dueDateBeforeMinutes(preference.getDueDateBeforeMinutes()).build();
    }
}
