package com.kanban.board.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBoardRequest {

    @Size(min = 1, max = 100, message = "보드 이름은 1~100자여야 합니다")
    private String name;

    @Size(max = 500, message = "설명은 500자 이하여야 합니다")
    private String description;

    @Size(max = 20, message = "테마 색상은 20자 이하여야 합니다")
    private String themeColor;

    @Size(max = 30, message = "아이콘은 30자 이하여야 합니다")
    private String icon;

    @Size(max = 20, message = "모드는 20자 이하여야 합니다")
    private String mode; // KANBAN or SPRINT
}
