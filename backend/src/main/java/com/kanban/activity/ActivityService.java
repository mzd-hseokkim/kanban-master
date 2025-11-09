package com.kanban.activity;

import com.kanban.user.User;
import com.kanban.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * 활동 로그 기록
     *
     * @param scopeType  활동 범위 (BOARD 또는 CARD)
     * @param scopeId    범위 ID (보드 ID 또는 카드 ID)
     * @param eventType  이벤트 타입
     * @param actorId    수행 사용자 ID
     * @param message    활동 메시지
     * @param payload    추가 데이터 (JSON)
     * @return 저장된 Activity
     */
    @Transactional
    public Activity recordActivity(
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
        return savedActivity;
    }

    /**
     * 활동 로그 기록 (payload 없음)
     */
    @Transactional
    public Activity recordActivity(
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
    public Page<Activity> getActivities(ActivityScopeType scopeType, Long scopeId, Pageable pageable) {
        return activityRepository.findByScopeTypeAndScopeIdOrderByCreatedAtDesc(scopeType, scopeId, pageable);
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
    public Page<Activity> getActivitiesByActor(
        ActivityScopeType scopeType,
        Long scopeId,
        Long actorId,
        Pageable pageable
    ) {
        return activityRepository.findByActorActivity(scopeType, scopeId, actorId, pageable);
    }

    /**
     * 특정 사용자의 모든 활동 조회
     *
     * @param actorId  사용자 ID
     * @param pageable 페이지네이션 정보
     * @return 활동 로그 페이지
     */
    public Page<Activity> getUserActivities(Long actorId, Pageable pageable) {
        return activityRepository.findByActorIdOrderByCreatedAtDesc(actorId, pageable);
    }

    /**
     * 특정 보드의 모든 활동 조회 (보드 및 하위 카드의 활동 포함)
     *
     * @param boardId  보드 ID
     * @param pageable 페이지네이션 정보
     * @return 활동 로그 페이지
     */
    public Page<Activity> getBoardActivities(Long boardId, Pageable pageable) {
        return activityRepository.findAllBoardActivities(boardId, pageable);
    }

    /**
     * 특정 활동 로그 조회
     *
     * @param id 활동 ID
     * @return Activity
     */
    public Activity getActivity(Long id) {
        return activityRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Activity not found: " + id));
    }
}
