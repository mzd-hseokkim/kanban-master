package com.kanban.goal;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.kanban.goal.dto.GoalCreateRequest;
import com.kanban.goal.dto.GoalDto;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @PostMapping("/boards/{boardId}/goals")
    public ResponseEntity<GoalDto> createGoal(@PathVariable Long boardId,
            @RequestBody GoalCreateRequest request) {
        request.setBoardId(boardId);
        return ResponseEntity.ok(goalService.createGoal(request));
    }

    @GetMapping("/boards/{boardId}/goals")
    public ResponseEntity<List<GoalDto>> getGoals(@PathVariable Long boardId) {
        return ResponseEntity.ok(goalService.getGoals(boardId));
    }

    @PutMapping("/goals/{goalId}/progress")
    public ResponseEntity<GoalDto> updateProgress(@PathVariable Long goalId,
            @RequestBody Integer progress) {
        return ResponseEntity.ok(goalService.updateProgress(goalId, progress));
    }
}
