package com.kanban.audit;

import java.time.LocalDateTime;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "audit_logs",
        indexes = {@Index(name = "idx_audit_target", columnList = "targetType, targetId"),
                @Index(name = "idx_audit_created_at", columnList = "createdAt")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditTargetType targetType;

    @Column(nullable = false)
    private String targetId;

    @Column(nullable = false)
    private Long actorId;

    private String ipAddress;

    private String userAgent;

    @Column(columnDefinition = "TEXT")
    private String changes; // JSON diff

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
