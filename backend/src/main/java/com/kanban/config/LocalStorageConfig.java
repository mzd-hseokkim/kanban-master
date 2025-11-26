package com.kanban.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.kanban.attachment.service.FileStorageService;
import com.kanban.attachment.service.LocalFileStorageService;
import lombok.extern.slf4j.Slf4j;

/**
 * 로컬 파일 스토리지 설정 storage.type=local 일 때 활성화
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageConfig {

    @Value("${storage.local.root-dir:uploads}")
    private String rootDir;

    @Bean
    public FileStorageService fileStorageService() {
        log.info("========================================");
        log.info("Initializing LocalFileStorageService");
        log.info("Root Directory: {}", rootDir);
        log.info("========================================");

        LocalFileStorageService service = new LocalFileStorageService(rootDir);
        log.info("✓ LocalFileStorageService created successfully");

        return service;
    }
}
