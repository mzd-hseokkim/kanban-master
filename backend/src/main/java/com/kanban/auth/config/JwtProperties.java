package com.kanban.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        String secretKey,
        long accessTokenValiditySeconds,
        long refreshTokenValiditySeconds,
        String refreshTokenCookieName
) {
}
