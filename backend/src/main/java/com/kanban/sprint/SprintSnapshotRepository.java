package com.kanban.sprint;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SprintSnapshotRepository extends JpaRepository<SprintSnapshot, Long> {
    List<SprintSnapshot> findBySprintIdOrderBySnapshotDateAsc(Long sprintId);

    @Query("""
            SELECT ss FROM SprintSnapshot ss
            WHERE ss.sprint.id IN :sprintIds
              AND ss.createdAt = (
                  SELECT MAX(sub.createdAt) FROM SprintSnapshot sub
                  WHERE sub.sprint.id = ss.sprint.id
                    AND sub.snapshotDate = (
                        SELECT MAX(sub2.snapshotDate) FROM SprintSnapshot sub2
                        WHERE sub2.sprint.id = ss.sprint.id
                    )
              )
            """)
    List<SprintSnapshot> findLatestSnapshotsBySprintIds(@Param("sprintIds") List<Long> sprintIds);
}
