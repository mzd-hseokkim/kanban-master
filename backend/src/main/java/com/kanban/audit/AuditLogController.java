package com.kanban.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final com.kanban.board.BoardRepository boardRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(required = false) AuditTargetType targetType,
            @RequestParam(required = false) String targetId,
            @RequestParam(required = false) Long actorId, @PageableDefault(sort = "createdAt",
                    direction = Sort.Direction.DESC) Pageable pageable) {

        // Get current user
        Long currentUserId = com.kanban.common.SecurityUtil.getCurrentUserId();
        boolean isAdmin = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // Check if user owns any boards (board owners can see all logs for their boards)
        boolean isBoardOwner = !boardRepository.findByOwnerId(currentUserId).isEmpty();

        // Admin or board owner can view more logs
        boolean canViewAllLogs = isAdmin || isBoardOwner;

        // If not admin/owner, force filter by current user's actorId
        Long effectiveActorId = actorId;
        if (!canViewAllLogs) {
            effectiveActorId = currentUserId;
        }

        if (targetType != null && targetId != null) {
            Page<AuditLog> logs =
                    auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType,
                            targetId, pageable);
            // Filter by actorId if not admin/owner
            if (!canViewAllLogs) {
                logs = auditLogRepository.findByActorIdOrderByCreatedAtDesc(currentUserId,
                        pageable);
            }
            return ResponseEntity.ok(logs);
        } else if (effectiveActorId != null) {
            return ResponseEntity.ok(auditLogRepository
                    .findByActorIdOrderByCreatedAtDesc(effectiveActorId, pageable));
        } else {
            // Only admins/owners can view all logs without filters
            if (canViewAllLogs) {
                return ResponseEntity.ok(auditLogRepository.findAll(pageable));
            } else {
                // Non-admins/owners can only see their own logs
                return ResponseEntity.ok(auditLogRepository
                        .findByActorIdOrderByCreatedAtDesc(currentUserId, pageable));
            }
        }
    }
}
