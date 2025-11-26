package com.kanban.notification;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.kanban.card.Card;
import com.kanban.card.CardRepository;
import com.kanban.notification.domain.NotificationType;
import com.kanban.notification.service.NotificationService;
import com.kanban.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final CardRepository cardRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final NotificationLogRepository logRepository;
    private final NotificationService notificationService;

    /**
     * 마감일 임박 알림 스케줄러 10분마다 실행
     */
    @Scheduled(cron = "0 0/10 * * * *")
    @Transactional
    public void checkDueDateImminent() {
        log.info("Checking for imminent due dates...");

        LocalDateTime now = LocalDateTime.now();
        // 최대 24시간 + 10분 후까지 마감인 카드 조회 (넉넉하게 조회 후 필터링)
        LocalDateTime end = now.plusMinutes(24L * 60 + 10);

        List<Card> cards = cardRepository.findCardsDueBetween(now, end);

        for (Card card : cards) {
            checkAndNotify(card, now);
        }
    }

    private void checkAndNotify(Card card, LocalDateTime now) {
        User assignee = card.getAssignee();
        if (assignee == null) {
            return;
        }

        NotificationPreference preference = preferenceRepository.findByUser(assignee)
                .orElseGet(() -> NotificationPreference.builder().user(assignee).notifyDueDate(true)
                        .dueDateBeforeMinutes(60) // 기본값 1시간
                        .build());

        if (!preference.isNotifyDueDate()) {
            return;
        }

        // 알림 발송 시점 계산 (마감일 - 설정 시간)
        // Card.dueDate는 LocalDate이므로 LocalDateTime으로 변환 필요 (시간은 자정 기준 또는 별도 시간 필드 필요)
        // 현재 Card 엔티티에는 dueDate(LocalDate)만 있고 시간 정보가 없음.
        // 임시로 마감일 자정(00:00)을 기준으로 하거나, 23:59:59를 기준으로 해야 함.
        // 보통 마감일은 해당 날짜의 끝(23:59:59)으로 간주하는 것이 일반적임.
        LocalDateTime dueDateTime = card.getDueDate().atTime(23, 59, 59);

        LocalDateTime notifyTime = dueDateTime.minusMinutes(preference.getDueDateBeforeMinutes());

        // 현재 시간이 알림 발송 시점을 지났고, 아직 마감일은 지나지 않았을 때
        if (now.isAfter(notifyTime) && now.isBefore(dueDateTime)) {
            // 이미 알림을 보냈는지 확인
            boolean alreadySent = logRepository.existsByCardAndUserAndNotificationType(card,
                    assignee, NotificationType.DUE_DATE_IMMINENT);

            if (!alreadySent) {
                sendNotification(card, assignee);
            }
        }
    }

    private void sendNotification(Card card, User user) {
        log.info("Sending due date notification for card {} to user {}", card.getId(),
                user.getEmail());

        // 1. 알림 발송
        String message = String.format("카드 '%s'의 마감일이 임박했습니다.", card.getTitle());
        String relatedUrl = String.format("/workspaces/%d/boards/%d?cardId=%d&columnId=%d",
                card.getColumn().getBoard().getWorkspace().getId(),
                card.getColumn().getBoard().getId(), card.getId(), card.getColumn().getId());

        notificationService.createNotification(user.getId(), NotificationType.DUE_DATE_IMMINENT,
                message, relatedUrl);

        // 2. 발송 기록 저장
        NotificationLog notificationLog = NotificationLog.builder().card(card).user(user)
                .notificationType(NotificationType.DUE_DATE_IMMINENT).sentAt(LocalDateTime.now())
                .build();

        logRepository.save(notificationLog);
    }
}
