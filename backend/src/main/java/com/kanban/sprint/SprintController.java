package com.kanban.sprint;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.kanban.card.dto.CardResponse;
import com.kanban.sprint.dto.SprintCreateRequest;
import com.kanban.sprint.dto.SprintDto;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @PostMapping("/boards/{boardId}/sprints")
    public ResponseEntity<SprintDto> createSprint(@PathVariable Long boardId,
            @RequestBody SprintCreateRequest request) {
        request.setBoardId(boardId);
        return ResponseEntity.ok(sprintService.createSprint(request));
    }

    @GetMapping("/boards/{boardId}/sprints")
    public ResponseEntity<List<SprintDto>> getSprints(@PathVariable Long boardId) {
        return ResponseEntity.ok(sprintService.getSprints(boardId));
    }

    @GetMapping("/boards/{boardId}/backlog")
    public ResponseEntity<List<CardResponse>> getBacklog(@PathVariable Long boardId) {
        return ResponseEntity.ok(sprintService.getBacklog(boardId));
    }



    @PutMapping("/sprints/{sprintId}/start")
    public ResponseEntity<SprintDto> startSprint(@PathVariable Long sprintId) {
        return ResponseEntity.ok(sprintService.startSprint(sprintId));
    }

    @PutMapping("/sprints/{sprintId}/complete")
    public ResponseEntity<SprintDto> completeSprint(@PathVariable Long sprintId) {
        return ResponseEntity.ok(sprintService.completeSprint(sprintId));
    }

    @PostMapping("/sprints/{sprintId}/cards")
    public ResponseEntity<Void> assignCards(@PathVariable Long sprintId,
            @RequestBody List<Long> cardIds) {
        sprintService.assignCardsToSprint(sprintId, cardIds);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/sprints/{sprintId}/cards/{cardId}")
    public ResponseEntity<Void> removeCard(@PathVariable Long sprintId, @PathVariable Long cardId) {
        sprintService.removeCardFromSprint(sprintId, cardId);
        return ResponseEntity.ok().build();
    }
}
