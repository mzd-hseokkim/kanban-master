package com.kanban.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 프로필 사진 업로드 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarUploadResponse {

    /**
     * 업로드된 아바타 URL
     */
    private String avatarUrl;

    /**
     * 업로드 시간
     */
    private LocalDateTime uploadedAt;
}
