package com.kanban.analytics;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.kanban.analytics.dto.BurndownDataPoint;
import com.kanban.analytics.dto.CycleTimeData;
import com.kanban.card.Card;
import com.kanban.card.CardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final CardRepository cardRepository;

    public List<BurndownDataPoint> getBurndownChart(Long boardId, int days) {
        List<Card> allCards = cardRepository.findByBoardId(boardId);
        log.info("Found {} cards for board {}", allCards.size(), boardId);
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(days);

        List<BurndownDataPoint> points = new ArrayList<>();

        for (int i = 0; i <= days; i++) {
            LocalDate date = startDate.plusDays(i);
            LocalDateTime endOfDay = date.atTime(23, 59, 59);

            long remaining = allCards.stream()
                    .filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isBefore(endOfDay)) // Created
                                                                                                  // before
                                                                                                  // this
                                                                                                  // day
                    .filter(c -> c.getCompletedAt() == null || c.getCompletedAt().isAfter(endOfDay)) // Not
                                                                                                     // completed
                                                                                                     // yet
                                                                                                     // or
                                                                                                     // completed
                                                                                                     // after
                    .filter(c -> !Boolean.TRUE.equals(c.getIsArchived())
                            || (c.getArchivedAt() != null && c.getArchivedAt().isAfter(endOfDay))) // Not
                                                                                                   // archived
                                                                                                   // or
                                                                                                   // archived
                                                                                                   // after
                    .count();

            points.add(BurndownDataPoint.builder().date(date).remainingTasks(remaining)
                    .idealTasks(null) // Can be calculated if we have a sprint concept
                    .build());
        }

        return points;
    }

    public List<CycleTimeData> getCycleTime(Long boardId) {
        List<Card> completedCards = cardRepository.findByBoardIdAndIsCompletedTrue(boardId);

        return completedCards.stream()
                .filter(c -> c.getStartedAt() != null && c.getCompletedAt() != null).map(c -> {
                    Duration duration = Duration.between(c.getStartedAt(), c.getCompletedAt());
                    double days = duration.toMinutes() / (24.0 * 60.0);
                    return CycleTimeData.builder().cardId(c.getId()).title(c.getTitle())
                            .cycleTimeDays(Math.round(days * 100.0) / 100.0)
                            .completedAt(c.getCompletedAt()).build();
                }).sorted(Comparator.comparing(CycleTimeData::getCompletedAt))
                .toList();
    }

    public Long getCompletedTasksCount(Long boardId) {
        List<Card> completedCards = cardRepository.findByBoardIdAndIsCompletedTrue(boardId);
        return completedCards.stream().filter(c -> !Boolean.TRUE.equals(c.getIsArchived())).count();
    }
}
