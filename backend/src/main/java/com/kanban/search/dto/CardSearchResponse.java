package com.kanban.search.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.kanban.label.dto.LabelResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 카드 검색 결과 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardSearchResponse {

    private Long id;
    private Long columnId;
    private String columnName;
    private Long boardId;
    private String boardName;
    private String title;
    private String description;
    private Integer position;
    private String bgColor;
    private String priority;
    private Long assigneeId;
    private LocalDate dueDate;
    private Boolean isCompleted;
    private List<LabelResponse> labels;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
