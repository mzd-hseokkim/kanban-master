package com.kanban.attachment;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.kanban.attachment.dto.AttachmentResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CardAttachmentController {

    private final CardAttachmentService attachmentService;

    /**
     * 파일 업로드
     */
    @PostMapping("/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}/attachments")
    public ResponseEntity<AttachmentResponse> uploadAttachment(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId,
            @RequestParam("file") MultipartFile file) throws IOException {

        AttachmentResponse response = attachmentService.uploadAttachment(cardId, file);
        return ResponseEntity.ok(response);
    }

    /**
     * 첨부파일 목록 조회
     */
    @GetMapping("/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> getAttachments(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @PathVariable Long columnId, @PathVariable Long cardId) {

        List<AttachmentResponse> attachments = attachmentService.getAttachments(cardId);
        return ResponseEntity.ok(attachments);
    }

    /**
     * 파일 다운로드
     */
    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long attachmentId)
            throws IOException {
        Resource resource = attachmentService.downloadAttachment(attachmentId);
        CardAttachment attachment = attachmentService.getAttachment(attachmentId);

        // 한글 파일명 처리
        String encodedFileName = URLEncoder
                .encode(attachment.getOriginalFileName(), StandardCharsets.UTF_8.toString())
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + encodedFileName + "\"")
                .body(resource);
    }

    /**
     * 파일 삭제
     */
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId)
            throws IOException {
        attachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }
}
