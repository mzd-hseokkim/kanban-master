package com.kanban.auth.apitoken;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiTokenRepository extends JpaRepository<ApiToken, Long> {
    Optional<ApiToken> findByTokenHash(String tokenHash);

    Optional<ApiToken> findByIdAndOwnerUserId(Long id, Long ownerUserId);

    List<ApiToken> findByOwnerUserIdOrderByCreatedAtDesc(Long ownerUserId);
}
