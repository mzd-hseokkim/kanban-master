package com.kanban.sprint;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.kanban.board.Board;
import com.kanban.board.BoardRepository;
import com.kanban.card.Card;
import com.kanban.card.CardRepository;
import com.kanban.card.dto.CardResponse;
import com.kanban.exception.ResourceNotFoundException;
import com.kanban.sprint.dto.SprintCreateRequest;
import com.kanban.sprint.dto.SprintDto;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SprintService {

    private final SprintRepository sprintRepository;
    private final BoardRepository boardRepository;
    private final CardRepository cardRepository;
    private final SprintSnapshotRepository sprintSnapshotRepository;

    public SprintDto createSprint(SprintCreateRequest request) {
        Board board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));

        Sprint sprint = new Sprint();
        sprint.setName(request.getName());
        sprint.setStartDate(request.getStartDate());
        sprint.setEndDate(request.getEndDate());
        sprint.setGoalText(request.getGoalText());
        sprint.setCapacity(request.getCapacity());
        sprint.setBoard(board);
        sprint.setStatus(SprintStatus.PLANNED);

        Sprint savedSprint = sprintRepository.save(sprint);
        return toDto(savedSprint);
    }

    public SprintDto startSprint(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));

        // Check if there is already an active sprint for this board
        sprintRepository.findFirstByBoardIdAndStatus(sprint.getBoard().getId(), SprintStatus.ACTIVE)
                .ifPresent(activeSprint -> {
                    throw new IllegalStateException(
                            "There is already an active sprint for this board.");
                });

        sprint.setStatus(SprintStatus.ACTIVE);
        Sprint savedSprint = sprintRepository.save(sprint);

        // Capture initial snapshot
        captureSnapshot(savedSprint);

        return toDto(savedSprint);
    }

    public SprintDto completeSprint(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));

        if (sprint.getStatus() != SprintStatus.ACTIVE) {
            throw new IllegalStateException("Only active sprints can be completed.");
        }

        // 1. Handle Rollover
        List<Card> incompleteCards = cardRepository.findBySprintIdAndIsCompletedFalse(sprintId);
        for (Card card : incompleteCards) {
            rolloverCard(card);
        }

        // 2. Complete Sprint
        sprint.setStatus(SprintStatus.COMPLETED);
        Sprint savedSprint = sprintRepository.save(sprint);

        // Capture final snapshot
        captureSnapshot(savedSprint);

        return toDto(savedSprint);
    }

    private void rolloverCard(Card card) {
        // Clone the card
        Card newCard = new Card();
        newCard.setColumn(card.getColumn()); // Keep in same column? Or move to backlog? Usually
                                             // backlog or next sprint.
        // For now, let's keep it in the same column but clear sprint or set to next sprint.
        // Requirement says: "Clone to next sprint or backlog".
        // Since we don't know the next sprint here, we'll move it to backlog (sprint = null).
        // The user can then assign it to the next sprint.
        newCard.setSprint(null);

        newCard.setTitle(card.getTitle());
        newCard.setDescription(card.getDescription());
        newCard.setPosition(card.getPosition());
        newCard.setBgColor(card.getBgColor());
        newCard.setPriority(card.getPriority());
        newCard.setAssignee(card.getAssignee());
        newCard.setDueDate(card.getDueDate());
        newCard.setIsCompleted(false);
        newCard.setStoryPoints(card.getStoryPoints());
        newCard.setOriginalCard(card); // Link to original card

        // Save new card
        cardRepository.save(newCard);

        // Mark old card as "Rolled Over" (We don't have a status for this in Card entity,
        // but we can archive it or just leave it as is in the completed sprint.
        // The requirement says: "Original card is 'Rolled Over' status".
        // Since Card doesn't have a status field other than isCompleted/isArchived,
        // and we want to keep record, maybe we should just leave it in the sprint.
        // But to distinguish, maybe we can add a flag or just rely on it being in a completed
        // sprint and not completed.
        // Wait, if we clone it, the old one should probably be marked as 'Archived' or similar to
        // avoid duplicates in board view if not filtered by sprint.
        // But Board View filters by Active Sprint.
        // Let's just leave the old card as is, but maybe mark it as archived to hide it from
        // general views?
        // Or better, since it's in a completed sprint, it won't show up in active sprint view.
        // But it might show up in "All Cards" view.
        // Let's archive the old card to be safe and clean.
        card.setIsArchived(true);
        card.setArchivedAt(java.time.LocalDateTime.now());
        cardRepository.save(card);
    }

    public void captureSnapshot(Sprint sprint) {
        List<Card> cards = cardRepository.findBySprintId(sprint.getId());

        int totalPoints = cards.stream()
                .mapToInt(c -> c.getStoryPoints() != null ? c.getStoryPoints() : 0).sum();
        int completedPoints = cards.stream().filter(Card::getIsCompleted)
                .mapToInt(c -> c.getStoryPoints() != null ? c.getStoryPoints() : 0).sum();
        int remainingPoints = totalPoints - completedPoints;

        Map<String, Integer> statusCounts = cards.stream()
                .collect(Collectors.groupingBy(c -> c.getIsCompleted() ? "DONE" : "TODO", // Simplified
                                                                                          // status
                        Collectors.summingInt(e -> 1)));

        SprintSnapshot snapshot = new SprintSnapshot();
        snapshot.setSprint(sprint);
        snapshot.setSnapshotDate(LocalDate.now());
        snapshot.setTotalPoints(totalPoints);
        snapshot.setCompletedPoints(completedPoints);
        snapshot.setRemainingPoints(remainingPoints);
        snapshot.setStatusCounts(statusCounts);

        sprintSnapshotRepository.save(snapshot);
    }

    public List<SprintDto> getSprints(Long boardId) {
        List<Sprint> sprints = sprintRepository.findByBoardIdOrderByStartDateDesc(boardId);

        // 모든 스프린트의 카드 개수를 한 번에 조회 (N+1 문제 방지)
        List<Long> sprintIds = sprints.stream().map(Sprint::getId).collect(Collectors.toList());
        Map<Long, Long> cardCountMap = cardRepository.countCardsBySprintIds(sprintIds);

        // 모든 스프린트의 포인트 합계를 한 번에 조회 (스냅샷 없을 때 사용)
        Map<Long, CardRepository.PointSummary> pointsMap =
                cardRepository.sumPointsBySprintIdsMap(sprintIds);

        // 모든 스프린트의 최신 스냅샷을 한 번에 조회 (N+1 문제 방지)
        Map<Long, SprintSnapshot> latestSnapshotMap =
                sprintIds.isEmpty() ? Map.of() : sprintSnapshotRepository
                        .findLatestSnapshotsBySprintIds(sprintIds)
                        .stream()
                        .collect(Collectors.toMap(
                                ss -> ss.getSprint().getId(),
                                ss -> ss,
                                (existing, replacement) -> {
                                    // 최신 스냅샷: 날짜 우선, 같다면 생성 시각으로 비교
                                    if (replacement.getSnapshotDate()
                                            .isAfter(existing.getSnapshotDate())) {
                                        return replacement;
                                    }
                                    if (replacement.getSnapshotDate()
                                            .isEqual(existing.getSnapshotDate())
                                            && replacement.getCreatedAt()
                                                    .isAfter(existing.getCreatedAt())) {
                                        return replacement;
                                    }
                                    return existing;
                                }));

        return sprints.stream()
                .map(sprint -> toDtoWithCardCountAndPoints(
                        sprint,
                        cardCountMap.getOrDefault(sprint.getId(), 0L).intValue(),
                        latestSnapshotMap.get(sprint.getId()),
                        pointsMap.get(sprint.getId())
                ))
                .collect(Collectors.toList());
    }

    public List<CardResponse> getBacklog(Long boardId) {
        return cardRepository.findBacklogCardsByBoardId(boardId).stream().map(CardResponse::from)
                .collect(Collectors.toList());
    }

    public List<SprintSnapshot> getBurndown(Long sprintId) {
        return sprintSnapshotRepository.findBySprintIdOrderBySnapshotDateAsc(sprintId);
    }

    public List<Integer> getVelocity(Long boardId) {
        // Get last 5 completed sprints
        List<Sprint> completedSprints =
                sprintRepository.findByBoardIdAndStatus(boardId, SprintStatus.COMPLETED);
        // Sort by end date desc and take 5
        return completedSprints.stream()
                .sorted((s1, s2) -> s2.getEndDate().compareTo(s1.getEndDate())).limit(5).map(s -> {
                    // Calculate completed points for each sprint
                    // This might be expensive if we calculate on the fly.
                    // Better to store 'completedPoints' in Sprint entity when completing.
                    // But for now, let's use the last snapshot or calculate from cards (but cards
                    // move...).
                    // Actually, we should use the last snapshot of the sprint.
                    List<SprintSnapshot> snapshots = sprintSnapshotRepository
                            .findBySprintIdOrderBySnapshotDateAsc(s.getId());
                    if (snapshots.isEmpty())
                        return 0;
                    return snapshots.get(snapshots.size() - 1).getCompletedPoints();
                }).collect(Collectors.toList());
    }

    public void assignCardsToSprint(Long sprintId, List<Long> cardIds) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));

        List<Card> cards = cardRepository.findAllById(cardIds);
        for (Card card : cards) {
            card.setSprint(sprint);
        }
        cardRepository.saveAll(cards);
    }

    public void removeCardFromSprint(Long sprintId, Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        if (card.getSprint() != null && card.getSprint().getId().equals(sprintId)) {
            card.setSprint(null);
            cardRepository.save(card);
        } else {
            throw new IllegalArgumentException("Card is not assigned to this sprint");
        }
    }

    private SprintDto toDto(Sprint sprint) {
        return SprintDto.builder().id(sprint.getId()).name(sprint.getName())
                .startDate(sprint.getStartDate()).endDate(sprint.getEndDate())
                .status(sprint.getStatus()).goalText(sprint.getGoalText())
                .capacity(sprint.getCapacity()).boardId(sprint.getBoard().getId()).build();
    }

    private SprintDto toDtoWithCardCount(Sprint sprint, Integer cardCount) {
        return SprintDto.builder().id(sprint.getId()).name(sprint.getName())
                .startDate(sprint.getStartDate()).endDate(sprint.getEndDate())
                .status(sprint.getStatus()).goalText(sprint.getGoalText())
                .capacity(sprint.getCapacity()).boardId(sprint.getBoard().getId())
                .cardCount(cardCount).build();
    }

    private SprintDto toDtoWithCardCountAndPoints(Sprint sprint, Integer cardCount, SprintSnapshot snapshot,
            CardRepository.PointSummary pointSummary) {
        SprintDto.SprintDtoBuilder builder = SprintDto.builder()
                .id(sprint.getId())
                .name(sprint.getName())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .status(sprint.getStatus())
                .goalText(sprint.getGoalText())
                .capacity(sprint.getCapacity())
                .boardId(sprint.getBoard().getId())
                .cardCount(cardCount);

        boolean isActiveOrPlanned = sprint.getStatus() == SprintStatus.ACTIVE
                || sprint.getStatus() == SprintStatus.PLANNED;

        // 진행중/계획 스프린트는 실시간 카드 합계를 우선 사용해 최신 포인트를 반영
        if (isActiveOrPlanned && pointSummary != null) {
            builder.totalPoints(pointSummary.totalPoints())
                   .completedPoints(pointSummary.completedPoints());
        } else if (snapshot != null) {
            // 완료 스프린트는 스냅샷(완료 시점)을 우선 사용
            builder.totalPoints(snapshot.getTotalPoints())
                   .completedPoints(snapshot.getCompletedPoints());
        } else if (pointSummary != null) {
            // 스냅샷이 없으면 카드 합계를 백업으로 사용
            builder.totalPoints(pointSummary.totalPoints())
                   .completedPoints(pointSummary.completedPoints());
        }

        return builder.build();
    }
}
