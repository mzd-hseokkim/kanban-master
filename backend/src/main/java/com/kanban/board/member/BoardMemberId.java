package com.kanban.board.member;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

/**
 * BoardMember의 복합 기본키
 * 보드 ID와 사용자 ID의 조합으로 고유성 보장
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardMemberId implements Serializable {

    private Long boardId;
    private Long userId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BoardMemberId that = (BoardMemberId) o;
        return Objects.equals(boardId, that.boardId) &&
               Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(boardId, userId);
    }
}
