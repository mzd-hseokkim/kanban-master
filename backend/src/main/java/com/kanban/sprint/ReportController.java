package com.kanban.sprint;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReportController {

    private final SprintService sprintService;

    @GetMapping("/sprints/{sprintId}/burndown")
    public ResponseEntity<List<SprintSnapshot>> getBurndown(@PathVariable Long sprintId) {
        return ResponseEntity.ok(sprintService.getBurndown(sprintId));
    }

    @GetMapping("/boards/{boardId}/velocity")
    public ResponseEntity<List<Integer>> getVelocity(@PathVariable Long boardId) {
        return ResponseEntity.ok(sprintService.getVelocity(boardId));
    }
}
