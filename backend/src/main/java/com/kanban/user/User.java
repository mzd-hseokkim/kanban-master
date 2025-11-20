package com.kanban.user;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.kanban.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /**
     * 비밀번호 해시 Spec § 6. 백엔드 규격 - User 엔티티 변경 FR-06c: 소셜 로그인 전용 사용자 지원을 위해 nullable 허용
     */
    @JsonIgnore
    @Column(nullable = true)
    private String password;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    private LocalDateTime lastLoginAt;

    /**
     * 이메일 인증 완료 여부
     */
    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean emailVerified = true;

    /**
     * 이메일 인증 토큰 (UUID)
     */
    @Column(length = 255)
    private String verificationToken;

    /**
     * 인증 토큰 만료 시간
     */
    private LocalDateTime verificationTokenExpiry;

    /**
     * 이메일 인증 완료 시각
     */
    private LocalDateTime emailVerifiedAt;
}
