package com.kanban.dashboard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.kanban.dashboard.dto.BoardInsightsResponse;
import com.kanban.dashboard.dto.DashboardSummaryResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getGlobalSummary(
            @PathVariable Long workspaceId) {
        return ResponseEntity.ok(dashboardService.getGlobalSummary(workspaceId));
    }

    @GetMapping("/boards/{boardId}/insights")
    public ResponseEntity<BoardInsightsResponse> getBoardInsights(@PathVariable Long workspaceId,
            @PathVariable Long boardId) {
        // Note: workspaceId is in the path but might not be needed if boardId is unique,
        // but good for validation. For now just pass boardId.
        return ResponseEntity.ok(dashboardService.getBoardInsights(boardId));
    }
}
