package com.kanban.attachment;

import java.io.IOException;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.kanban.attachment.dto.AttachmentResponse;
import com.kanban.attachment.service.FileStorageService;
import com.kanban.card.Card;
import com.kanban.card.CardRepository;
import com.kanban.exception.ResourceNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CardAttachmentService {

    private static final String ATTACHMENT_NOT_FOUND = "Attachment not found";

    private final CardAttachmentRepository attachmentRepository;
    private final CardRepository cardRepository;
    private final FileStorageService fileStorageService;

    /**
     * 파일 업로드
     */
    public AttachmentResponse uploadAttachment(Long cardId, MultipartFile file) throws IOException {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        // 파일 저장
        String storedFileName = fileStorageService.store(file, "attachments");

        // DB 저장
        CardAttachment attachment =
                CardAttachment.builder().card(card).originalFileName(file.getOriginalFilename())
                        .storedFileName(storedFileName).contentType(file.getContentType())
                        .fileSize(file.getSize()).filePath(storedFileName) // 로컬 스토리지인 경우 파일명만 저장해도
                                                                           // 무방
                        .build();

        CardAttachment saved = attachmentRepository.save(attachment);
        return AttachmentResponse.from(saved);
    }

    /**
     * 첨부파일 목록 조회
     */
    public List<AttachmentResponse> getAttachments(Long cardId) {
        return attachmentRepository.findByCardId(cardId).stream().map(AttachmentResponse::from)
                .toList();
    }

    /**
     * 파일 다운로드 (Resource 반환)
     */
    public Resource downloadAttachment(Long attachmentId) throws IOException {
        CardAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException(ATTACHMENT_NOT_FOUND));

        return fileStorageService.load(attachment.getStoredFileName());
    }

    /**
     * 첨부파일 엔티티 조회 (파일명 등 메타데이터 필요 시)
     */
    public CardAttachment getAttachment(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException(ATTACHMENT_NOT_FOUND));
    }

    /**
     * 파일 삭제
     */
    public void deleteAttachment(Long attachmentId) throws IOException {
        CardAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException(ATTACHMENT_NOT_FOUND));

        // 스토리지에서 삭제
        fileStorageService.delete(attachment.getStoredFileName());

        // DB에서 삭제
        attachmentRepository.delete(attachment);
    }
}
