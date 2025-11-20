package com.kanban.watch;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import com.kanban.card.Card;
import com.kanban.card.CardRepository;
import com.kanban.card.dto.CardResponse;
import com.kanban.exception.ResourceNotFoundException;
import com.kanban.label.CardLabelRepository;
import com.kanban.label.dto.LabelResponse;
import com.kanban.notification.domain.NotificationType;
import com.kanban.notification.service.NotificationService;
import com.kanban.user.UserRepository;
import com.kanban.watch.dto.WatchResponse;
import com.kanban.watch.dto.WatchedCardResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * 카드 Watch 비즈니스 로직 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CardWatchService {

    private final CardWatchRepository cardWatchRepository;
    private final CardRepository cardRepository;
    private final CardLabelRepository cardLabelRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Watch 토글 (이미 watch 중이면 해제, 아니면 추가)
     */
    public WatchResponse toggleWatch(Long cardId, Long userId) {
        // 카드 존재 확인
        if (!cardRepository.existsById(cardId)) {
            throw new ResourceNotFoundException("Card not found");
        }

        Optional<CardWatch> existingWatch =
                cardWatchRepository.findByCardIdAndUserId(cardId, userId);

        if (existingWatch.isPresent()) {
            // 이미 watch 중이면 해제
            cardWatchRepository.delete(existingWatch.get());
            return WatchResponse.notWatching(cardId, userId);
        } else {
            // watch 추가
            CardWatch cardWatch = CardWatch.builder().cardId(cardId).userId(userId).build();
            CardWatch saved = cardWatchRepository.save(cardWatch);
            return WatchResponse.from(saved);
        }
    }

    /**
     * Watch 상태 조회
     */
    public WatchResponse getWatchStatus(Long cardId, Long userId) {
        Optional<CardWatch> watch = cardWatchRepository.findByCardIdAndUserId(cardId, userId);
        return watch.map(WatchResponse::from).orElse(WatchResponse.notWatching(cardId, userId));
    }

    /**
     * 사용자가 watch 중인 카드 목록 조회
     */
    public List<WatchedCardResponse> getWatchList(Long userId) {
        List<CardWatch> watches = cardWatchRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<WatchedCardResponse> result = new ArrayList<>();

        for (CardWatch watch : watches) {
            Optional<Card> cardOpt = cardRepository.findById(watch.getCardId());
            if (cardOpt.isEmpty()) {
                // 카드가 삭제된 경우 watch도 삭제
                cardWatchRepository.delete(watch);
                continue;
            }

            Card card = cardOpt.get();

            // 라벨 조회
            List<LabelResponse> labels = cardLabelRepository.findByCardId(card.getId()).stream()
                    .map(cardLabel -> LabelResponse.from(cardLabel.getLabel())).toList();

            CardResponse cardResponse = enrichWithAssigneeInfo(CardResponse.from(card, labels));

            WatchedCardResponse response = WatchedCardResponse.builder().watchId(watch.getId())
                    .card(cardResponse)
                    .workspaceId(card.getColumn().getBoard().getWorkspace().getId())
                    .boardId(card.getColumn().getBoard().getId())
                    .boardName(card.getColumn().getBoard().getName())
                    .columnId(card.getColumn().getId()).columnName(card.getColumn().getName())
                    .watchedAt(watch.getCreatedAt()).build();

            result.add(response);
        }

        return result;
    }

    /**
     * 특정 카드를 watch 중인지 확인
     */
    public boolean isWatching(Long cardId, Long userId) {
        return cardWatchRepository.existsByCardIdAndUserId(cardId, userId);
    }

    /**
     * Watch 중인 사용자들에게 알림 전송
     *
     * @param cardId 변경된 카드 ID
     * @param changeMessage 변경 내용 메시지
     * @param actorUserId 변경을 수행한 사용자 ID (본인 제외)
     */
    public void notifyWatchers(Long cardId, String changeMessage, Long actorUserId) {
        List<CardWatch> watchers = cardWatchRepository.findByCardId(cardId);

        if (watchers.isEmpty()) {
            return;
        }

        // 카드 정보 조회
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        Long workspaceId = card.getColumn().getBoard().getWorkspace().getId();
        Long boardId = card.getColumn().getBoard().getId();
        Long columnId = card.getColumn().getId();

        String actionUrl = "/boards/" + workspaceId + "/" + boardId + "?cardId=" + cardId
                + "&columnId=" + columnId;

        for (CardWatch watch : watchers) {
            // 본인이 변경한 경우는 알림 제외
            if (watch.getUserId().equals(actorUserId)) {
                continue;
            }

            notificationService.createNotification(watch.getUserId(), NotificationType.CARD_WATCH,
                    "관심 카드 \"" + card.getTitle() + "\"이 변경되었습니다: " + changeMessage, actionUrl);
        }
    }

    /**
     * CardResponse에 담당자 정보 추가
     */
    private CardResponse enrichWithAssigneeInfo(CardResponse cardResponse) {
        if (cardResponse.getAssigneeId() != null) {
            userRepository.findById(cardResponse.getAssigneeId()).ifPresent(user -> {
                cardResponse.setAssignee(user.getName());
                cardResponse.setAssigneeAvatarUrl(user.getAvatarUrl());
            });
        }
        return cardResponse;
    }
}
