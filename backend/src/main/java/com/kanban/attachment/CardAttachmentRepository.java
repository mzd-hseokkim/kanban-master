package com.kanban.attachment;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CardAttachmentRepository extends JpaRepository<CardAttachment, Long> {
    List<CardAttachment> findByCardId(Long cardId);
}
