package com.kanban.attachment.dto;

import java.time.LocalDateTime;
import com.kanban.attachment.CardAttachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentResponse {

    private Long id;
    private Long cardId;
    private String originalFileName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;

    public static AttachmentResponse from(CardAttachment attachment) {
        return AttachmentResponse.builder().id(attachment.getId())
                .cardId(attachment.getCard().getId())
                .originalFileName(attachment.getOriginalFileName())
                .contentType(attachment.getContentType()).fileSize(attachment.getFileSize())
                .createdAt(attachment.getCreatedAt()).build();
    }
}
