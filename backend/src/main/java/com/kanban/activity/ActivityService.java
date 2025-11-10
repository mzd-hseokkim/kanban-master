package com.kanban.activity;

import com.kanban.activity.dto.ActivityResponse;
import com.kanban.board.Board;
import com.kanban.board.BoardRepository;
import com.kanban.board.member.BoardMemberRepository;
import com.kanban.board.member.InvitationStatus;
import com.kanban.user.User;
import com.kanban.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * 활동 로그 서비스
 * 모든 주요 이벤트를 기록하고 조회하는 비즈니스 로직 제공
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;

    /**
     * 활동 로그 기록
     *
     * @param scopeType  활동 범위 (BOARD 또는 CARD)
     * @param scopeId    범위 ID (보드 ID 또는 카드 ID)
     * @param eventType  이벤트 타입
     * @param actorId    수행 사용자 ID
     * @param message    활동 메시지
     * @param payload    추가 데이터 (JSON)
     * @return 저장된 ActivityResponse
     */
    @Transactional
    public ActivityResponse recordActivity(
        ActivityScopeType scopeType,
        Long scopeId,
        ActivityEventType eventType,
        Long actorId,
        String message,
        String payload
    ) {
        User actor = userRepository.findById(actorId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + actorId));

        Activity activity = Activity.builder()
            .scopeType(scopeType)
            .scopeId(scopeId)
            .eventType(eventType)
            .actor(actor)
            .message(message)
            .payload(payload)
            .build();

        Activity savedActivity = activityRepository.save(activity);
        log.info("Activity recorded - Type: {}, Scope: {}, Actor: {}", eventType, scopeType, actorId);
        return ActivityResponse.from(savedActivity);
    }

    /**
     * 활동 로그 기록 (payload 없음)
     */
    @Transactional
    public ActivityResponse recordActivity(
        ActivityScopeType scopeType,
        Long scopeId,
        ActivityEventType eventType,
        Long actorId,
        String message
    ) {
        return recordActivity(scopeType, scopeId, eventType, actorId, message, null);
    }

    /**
     * 특정 범위(보드 또는 카드)의 활동 로그 조회
     *
     * @param scopeType 활동 범위
     * @param scopeId   범위 ID
     * @param pageable  페이지네이션 정보
     * @return 활동 로그 페이지
     */
    public Page<ActivityResponse> getActivities(ActivityScopeType scopeType, Long scopeId, Pageable pageable) {
        return activityRepository.findByScopeTypeAndScopeIdOrderByCreatedAtDesc(scopeType, scopeId, pageable)
                .map(ActivityResponse::from);
    }

    /**
     * 특정 범위의 활동 중 특정 사용자의 활동만 조회
     *
     * @param scopeType 활동 범위
     * @param scopeId   범위 ID
     * @param actorId   사용자 ID
     * @param pageable  페이지네이션 정보
     * @return 활동 로그 페이지
     */
    public Page<ActivityResponse> getActivitiesByActor(
        ActivityScopeType scopeType,
        Long scopeId,
        Long actorId,
        Pageable pageable
    ) {
        return activityRepository.findByActorActivity(scopeType, scopeId, actorId, pageable)
                .map(ActivityResponse::from);
    }

    /**
     * 특정 사용자의 모든 활동 조회
     *
     * @param actorId  사용자 ID
     * @param pageable 페이지네이션 정보
     * @return 활동 로그 페이지
     */
    public Page<ActivityResponse> getUserActivities(Long actorId, Pageable pageable) {
        return activityRepository.findByActorIdOrderByCreatedAtDesc(actorId, pageable)
                .map(ActivityResponse::from);
    }

    /**
     * 특정 보드의 모든 활동 조회 (보드 및 하위 카드의 활동 포함)
     *
     * @param boardId  보드 ID
     * @param pageable 페이지네이션 정보
     * @return 활동 로그 페이지
     */
    public Page<ActivityResponse> getBoardActivities(Long boardId, Pageable pageable) {
        return activityRepository.findAllBoardActivities(boardId, pageable)
                .map(ActivityResponse::from);
    }

    /**
     * 특정 활동 로그 조회
     *
     * @param id 활동 ID
     * @return ActivityResponse
     */
    public ActivityResponse getActivity(Long id) {
        Activity activity = activityRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Activity not found: " + id));
        return ActivityResponse.from(activity);
    }

    /**
     * 보드 활동 조회 (권한 검증 포함)
     * 보드의 Owner이거나 ACCEPTED 멤버만 접근 가능
     *
     * @param boardId     보드 ID
     * @param currentUserId 현재 사용자 ID
     * @param pageable    페이지네이션 정보
     * @return 활동 로그 페이지
     */
    public Page<ActivityResponse> getBoardActivitiesWithValidation(Long boardId, Long currentUserId, Pageable pageable) {
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 없습니다");
        }

        // 보드 존재 확인 및 owner 확인
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "보드를 찾을 수 없습니다"));

        // Owner이면 무조건 접근 가능
        if (!board.getOwner().getId().equals(currentUserId)) {
            // Owner가 아니면 ACCEPTED 멤버인지 확인
            var memberOptional = boardMemberRepository.findByBoardIdAndUserId(boardId, currentUserId);
            if (memberOptional.isEmpty() || memberOptional.get().getInvitationStatus() != InvitationStatus.ACCEPTED) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이 보드에 접근할 권한이 없습니다");
            }
        }

        return getBoardActivities(boardId, pageable);
    }
}
