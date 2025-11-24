package com.kanban.history;

import java.util.List;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class CardHistoryListener {

    private final CardHistoryRepository cardHistoryRepository;

    @Async
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleCardChangedEvent(CardChangedEvent event) {
        log.info("Processing CardChangedEvent for cardId: {}, changes: {}", event.getCardId(),
                event.getChanges().size());

        List<CardHistory> histories = event.getChanges().stream()
                .map(change -> CardHistory.builder().cardId(event.getCardId())
                        .boardId(event.getBoardId()).field(change.getField())
                        .fromValue(change.getFrom()).toValue(change.getTo())
                        .changedByUserId(event.getUserId()).build())
                .toList();

        cardHistoryRepository.saveAll(histories);
    }
}
