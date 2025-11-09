package com.kanban.activity.dto;

import com.kanban.activity.Activity;
import com.kanban.activity.ActivityEventType;
import com.kanban.activity.ActivityScopeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 활동 로그 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityResponse {

    private Long id;
    private ActivityScopeType scopeType;
    private Long scopeId;
    private ActivityEventType eventType;
    private Long actorId;
    private String actorName;
    private String actorEmail;
    private String message;
    private String payload;
    private String createdAt;
    private String relativeTime;

    public static ActivityResponse from(Activity activity) {
        String relativeTime = getRelativeTime(activity.getCreatedAt());

        return ActivityResponse.builder()
            .id(activity.getId())
            .scopeType(activity.getScopeType())
            .scopeId(activity.getScopeId())
            .eventType(activity.getEventType())
            .actorId(activity.getActor().getId())
            .actorName(activity.getActor().getName())
            .actorEmail(activity.getActor().getEmail())
            .message(activity.getMessage())
            .payload(activity.getPayload())
            .createdAt(activity.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .relativeTime(relativeTime)
            .build();
    }

    /**
     * 상대 시간 계산 (예: "5분 전", "2시간 전")
     */
    private static String getRelativeTime(LocalDateTime createdAt) {
        LocalDateTime now = LocalDateTime.now();
        long seconds = java.time.temporal.ChronoUnit.SECONDS.between(createdAt, now);

        if (seconds < 60) {
            return "방금 전";
        } else if (seconds < 3600) {
            long minutes = seconds / 60;
            return minutes + "분 전";
        } else if (seconds < 86400) {
            long hours = seconds / 3600;
            return hours + "시간 전";
        } else if (seconds < 604800) {
            long days = seconds / 86400;
            return days + "일 전";
        } else {
            long weeks = seconds / 604800;
            return weeks + "주 전";
        }
    }
}
