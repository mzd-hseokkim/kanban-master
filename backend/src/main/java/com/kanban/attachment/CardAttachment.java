package com.kanban.attachment;

import com.kanban.card.Card;
import com.kanban.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * 카드 첨부파일 엔티티
 */
@Entity
@Table(name = "card_attachment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardAttachment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 첨부파일이 속한 카드
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    /**
     * 원본 파일명
     */
    @Column(nullable = false)
    private String originalFileName;

    /**
     * 저장된 파일명 (UUID 등)
     */
    @Column(nullable = false)
    private String storedFileName;

    /**
     * MIME 타입
     */
    @Column(nullable = false)
    private String contentType;

    /**
     * 파일 크기 (bytes)
     */
    @Column(nullable = false)
    private Long fileSize;

    /**
     * 파일 저장 경로 (상대 경로)
     */
    @Column(nullable = false)
    private String filePath;
}
