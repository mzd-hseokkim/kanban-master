package com.kanban.auth.apitoken;

import com.kanban.board.Board;
import com.kanban.board.member.BoardMemberRole;
import com.kanban.entity.BaseEntity;
import com.kanban.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "api_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 16)
    private String tokenPrefix;

    @Column(nullable = false, unique = true, length = 128)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id")
    private User ownerUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id")
    private Board board;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BoardMemberRole role;

    @Column(nullable = false, length = 255)
    private String scopes;

    @Column
    private LocalDateTime expiresAt;

    @Column
    private LocalDateTime revokedAt;

    @Column
    private LocalDateTime lastUsedAt;

    public Set<ApiTokenScope> getScopeSet() {
        if (scopes == null || scopes.isBlank()) {
            return EnumSet.noneOf(ApiTokenScope.class);
        }
        return Arrays.stream(scopes.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(ApiTokenScope::valueOf)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(ApiTokenScope.class)));
    }

    public void setScopeSet(Set<ApiTokenScope> scopeSet) {
        if (scopeSet == null || scopeSet.isEmpty()) {
            this.scopes = "";
            return;
        }
        this.scopes = scopeSet.stream()
                .map(ApiTokenScope::name)
                .sorted()
                .collect(Collectors.joining(","));
    }
}
