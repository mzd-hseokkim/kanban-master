package com.kanban.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.api-token")
public record ApiTokenProperties(
        String secretKey,
        String prefix
) {
}
