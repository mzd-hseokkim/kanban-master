package com.kanban.activity;

import com.kanban.activity.dto.ActivityResponse;
import com.kanban.board.BoardRepository;
import com.kanban.board.member.BoardMemberRepository;
import com.kanban.board.member.InvitationStatus;
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
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

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
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;

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
        // 현재 사용자 ID 조회
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "인증 정보가 없습니다");
        }

        // 보드 존재 확인 및 owner 확인
        var board = boardRepository.findById(boardId)
            .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "보드를 찾을 수 없습니다"));

        // Owner이면 무조건 접근 가능
        if (!board.getOwner().getId().equals(currentUserId)) {
            // Owner가 아니면 ACCEPTED 멤버인지 확인
            var memberOptional = boardMemberRepository.findByBoardIdAndUserId(boardId, currentUserId);
            if (memberOptional.isEmpty() || memberOptional.get().getInvitationStatus() != InvitationStatus.ACCEPTED) {
                throw new ResponseStatusException(FORBIDDEN, "이 보드에 접근할 권한이 없습니다");
            }
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Activity> activities = activityService.getBoardActivities(boardId, pageable);
        return ResponseEntity.ok(activities.map(ActivityResponse::from));
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

        Page<Activity> activities;
        if (actorId != null) {
            // 특정 사용자의 활동만 조회
            activities = activityService.getActivitiesByActor(ActivityScopeType.CARD, cardId, actorId, pageable);
        } else {
            // 모든 활동 조회
            activities = activityService.getActivities(ActivityScopeType.CARD, cardId, pageable);
        }

        return ResponseEntity.ok(activities.map(ActivityResponse::from));
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
        Page<Activity> activities = activityService.getUserActivities(userId, pageable);
        return ResponseEntity.ok(activities.map(ActivityResponse::from));
    }

    /**
     * 특정 활동 로그 조회
     */
    @GetMapping("/{id}")
    @Operation(summary = "활동 로그 상세 조회", description = "특정 활동 로그의 상세 정보를 조회합니다")
    public ResponseEntity<ActivityResponse> getActivity(@PathVariable Long id) {
        Activity activity = activityService.getActivity(id);
        return ResponseEntity.ok(ActivityResponse.from(activity));
    }
}
