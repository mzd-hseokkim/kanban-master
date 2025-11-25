package com.kanban.sprint;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByBoardIdOrderByStartDateDesc(Long boardId);

    List<Sprint> findByBoardIdAndStatus(Long boardId, SprintStatus status);

    Optional<Sprint> findFirstByBoardIdAndStatus(Long boardId, SprintStatus status); // For finding
                                                                                     // the
    // single active
    // sprint
}
