package com.kanban.notification;

import com.kanban.entity.BaseEntity;
import com.kanban.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_preference")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private boolean notifyDueDate = true; // 마감일 알림 사용 여부 (기본값 true)

    @Column(nullable = false)
    @Builder.Default
    private int dueDateBeforeMinutes = 60; // 몇 분 전에 알림을 보낼지 (기본값 60분 = 1시간)
}
