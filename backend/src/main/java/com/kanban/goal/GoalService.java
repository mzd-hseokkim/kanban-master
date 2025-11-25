package com.kanban.goal;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.kanban.board.Board;
import com.kanban.board.BoardRepository;
import com.kanban.exception.ResourceNotFoundException;
import com.kanban.goal.dto.GoalCreateRequest;
import com.kanban.goal.dto.GoalDto;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class GoalService {

    private final GoalRepository goalRepository;
    private final BoardRepository boardRepository;

    public GoalDto createGoal(GoalCreateRequest request) {
        Board board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));

        Goal goal = new Goal();
        goal.setBoard(board);
        goal.setTitle(request.getTitle());
        goal.setDescription(request.getDescription());
        goal.setMetricType(request.getMetricType());
        goal.setStatus(GoalStatus.ON_TRACK);
        goal.setProgress(0);

        Goal savedGoal = goalRepository.save(goal);
        return toDto(savedGoal);
    }

    public List<GoalDto> getGoals(Long boardId) {
        return goalRepository.findByBoardId(boardId).stream().map(this::toDto)
                .collect(Collectors.toList());
    }

    public GoalDto updateProgress(Long goalId, Integer progress) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));

        goal.setProgress(progress);
        return toDto(goalRepository.save(goal));
    }

    private GoalDto toDto(Goal goal) {
        return GoalDto.builder().id(goal.getId()).boardId(goal.getBoard().getId())
                .title(goal.getTitle()).description(goal.getDescription()).status(goal.getStatus())
                .progress(goal.getProgress()).metricType(goal.getMetricType()).build();
    }
}
