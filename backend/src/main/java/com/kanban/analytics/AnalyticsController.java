package com.kanban.analytics;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.kanban.analytics.dto.BurndownDataPoint;
import com.kanban.analytics.dto.CycleTimeData;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/boards/{boardId}/burndown")
    public ResponseEntity<List<BurndownDataPoint>> getBurndownChart(@PathVariable Long boardId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getBurndownChart(boardId, days));
    }

    @GetMapping("/boards/{boardId}/cycletime")
    public ResponseEntity<List<CycleTimeData>> getCycleTime(@PathVariable Long boardId) {
        return ResponseEntity.ok(analyticsService.getCycleTime(boardId));
    }
}
