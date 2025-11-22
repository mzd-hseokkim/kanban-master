package com.kanban.notification.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.kanban.notification.dto.NotificationPreferenceRequest;
import com.kanban.notification.dto.NotificationPreferenceResponse;
import com.kanban.notification.service.NotificationPreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/notifications/preferences")
@RequiredArgsConstructor
@Tag(name = "Notification Preferences", description = "알림 설정 API")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    @GetMapping
    @Operation(summary = "내 알림 설정 조회", description = "현재 로그인한 사용자의 알림 설정을 조회합니다")
    public ResponseEntity<NotificationPreferenceResponse> getMyPreference() {
        return ResponseEntity.ok(preferenceService.getMyPreference());
    }

    @PutMapping
    @Operation(summary = "내 알림 설정 수정", description = "현재 로그인한 사용자의 알림 설정을 수정합니다")
    public ResponseEntity<NotificationPreferenceResponse> updateMyPreference(
            @RequestBody NotificationPreferenceRequest request) {
        return ResponseEntity.ok(preferenceService.updateMyPreference(request));
    }
}
