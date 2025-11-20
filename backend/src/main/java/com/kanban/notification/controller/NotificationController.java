package com.kanban.notification.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.kanban.board.member.MemberService;
import com.kanban.board.member.dto.BoardMemberResponse;
import com.kanban.common.SecurityUtil;
import com.kanban.notification.domain.Notification;
import com.kanban.notification.dto.InboxItemDTO;
import com.kanban.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "알림 및 인박스 관리 API")
public class NotificationController {

        private final NotificationService notificationService;
        private final MemberService memberService;

        @GetMapping("/inbox")
        @Operation(summary = "인박스 조회", description = "대기 중인 초대와 읽지 않은 알림을 통합하여 조회합니다")
        public ResponseEntity<List<InboxItemDTO>> getInbox() {
                Long currentUserId = SecurityUtil.getCurrentUserId();
                List<InboxItemDTO> inboxItems = new ArrayList<>();

                // 1. Get Pending Invitations
                List<BoardMemberResponse> invitations =
                                memberService.getPendingInvitations(currentUserId);
                for (BoardMemberResponse invitation : invitations) {
                        inboxItems.add(InboxItemDTO.builder().id("inv-" + invitation.getBoardId()) // Using
                                                                                                   // boardId
                                                                                                   // as
                                                                                                   // part
                                                                                                   // of
                                                                                                   // ID
                                                                                                   // for
                                                                                                   // uniqueness
                                        .type("INVITATION").title("보드 초대")
                                        .message(invitation.getInvitedByName() + "님이 "
                                                        + invitation.getBoardName()
                                                        + " 보드에 초대했습니다.")
                                        .createdAt(LocalDateTime.parse(invitation.getInvitedAt(),
                                                        java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                                        .isRead(false)
                                        .payload(Map.of("invitationToken",
                                                        invitation.getInvitationToken(),
                                                        "boardName", invitation.getBoardName(),
                                                        "invitedByName",
                                                        invitation.getInvitedByName()))
                                        .build());
                }

                // 2. Get Recent Notifications (Unread + Read in last 24h)
                List<Notification> notifications =
                                notificationService.getRecentNotifications(currentUserId);
                for (Notification notification : notifications) {
                        inboxItems.add(InboxItemDTO.builder().id("notif-" + notification.getId())
                                        .type("NOTIFICATION").title("알림")
                                        .message(notification.getMessage())
                                        .actionUrl(notification.getRelatedUrl())
                                        .createdAt(notification.getCreatedAt())
                                        .isRead(notification.getIsRead())
                                        .payload(Map.of("type", notification.getType())).build());
                }

                // 3. Sort by CreatedAt Descending
                inboxItems.sort(Comparator.comparing(InboxItemDTO::getCreatedAt).reversed());

                return ResponseEntity.ok(inboxItems);
        }

        @PostMapping("/{id}/read")
        @Operation(summary = "알림 읽음 처리", description = "알림을 읽음 상태로 변경합니다")
        public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
                notificationService.markAsRead(id);
                return ResponseEntity.ok().build();
        }
}
