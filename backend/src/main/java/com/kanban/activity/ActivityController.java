package com.kanban.activity;

import com.kanban.activity.dto.ActivityResponse;
import com.kanban.common.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 활동 로그 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
@Tag(name = "Activities", description = "활동 로그 API")
public class ActivityController {

    private final ActivityService activityService;

    /**
     * 보드의 모든 활동 로그 조회
     */
    @GetMapping("/boards/{boardId}")
    @Operation(summary = "보드 활동 로그 조회", description = "특정 보드와 하위 카드의 모든 활동 로그를 조회합니다 (페이지네이션)")
    public ResponseEntity<Page<ActivityResponse>> getBoardActivities(
        @PathVariable Long boardId,
        @Parameter(description = "페이지 번호 (0부터 시작)")
        @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "페이지 크기")
        @RequestParam(defaultValue = "50") int size
    ) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ActivityResponse> activities = activityService.getBoardActivitiesWithValidation(boardId, currentUserId, pageable);
        return ResponseEntity.ok(activities);
    }

    /**
     * 카드의 활동 로그 조회
     */
    @GetMapping("/cards/{cardId}")
    @Operation(summary = "카드 활동 로그 조회", description = "특정 카드의 모든 활동 로그를 조회합니다 (페이지네이션)")
    public ResponseEntity<Page<ActivityResponse>> getCardActivities(
        @PathVariable Long cardId,
        @Parameter(description = "페이지 번호 (0부터 시작)")
        @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "페이지 크기")
        @RequestParam(defaultValue = "50") int size,
        @Parameter(description = "필터링할 사용자 ID (선택사항)")
        @RequestParam(required = false) Long actorId
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<ActivityResponse> activities;
        if (actorId != null) {
            // 특정 사용자의 활동만 조회
            activities = activityService.getActivitiesByActor(ActivityScopeType.CARD, cardId, actorId, pageable);
        } else {
            // 모든 활동 조회
            activities = activityService.getActivities(ActivityScopeType.CARD, cardId, pageable);
        }

        return ResponseEntity.ok(activities);
    }

    /**
     * 사용자의 활동 로그 조회
     */
    @GetMapping("/users/{userId}")
    @Operation(summary = "사용자 활동 로그 조회", description = "특정 사용자의 모든 활동 로그를 조회합니다")
    public ResponseEntity<Page<ActivityResponse>> getUserActivities(
        @PathVariable Long userId,
        @Parameter(description = "페이지 번호 (0부터 시작)")
        @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "페이지 크기")
        @RequestParam(defaultValue = "50") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ActivityResponse> activities = activityService.getUserActivities(userId, pageable);
        return ResponseEntity.ok(activities);
    }

    /**
     * 특정 활동 로그 조회
     */
    @GetMapping("/{id}")
    @Operation(summary = "활동 로그 상세 조회", description = "특정 활동 로그의 상세 정보를 조회합니다")
    public ResponseEntity<ActivityResponse> getActivity(@PathVariable Long id) {
        ActivityResponse activity = activityService.getActivity(id);
        return ResponseEntity.ok(activity);
    }
}
