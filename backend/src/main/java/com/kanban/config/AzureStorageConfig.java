package com.kanban.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.kanban.attachment.service.AzureBlobStorageService;
import com.kanban.attachment.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;

/**
 * Azure Blob Storage 설정 storage.type=azure 일 때 활성화
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "storage.type", havingValue = "azure")
public class AzureStorageConfig {

    @Value("${storage.azure.endpoint}")
    private String connectionString;

    @Value("${storage.azure.container-name:kanban-master}")
    private String containerName;

    @Bean
    public FileStorageService fileStorageService() {
        log.info("========================================");
        log.info("Initializing AzureBlobStorageService");
        log.info("Container Name: {}", containerName);
        log.info("Connection String: {}", connectionString);
        log.info("========================================");

        try {
            AzureBlobStorageService service =
                    new AzureBlobStorageService(connectionString, containerName);
            log.info("✓ AzureBlobStorageService created successfully");
            return service;
        } catch (Exception e) {
            log.error("✗ Failed to initialize AzureBlobStorageService", e);
            log.error("Connection String used: {}", connectionString);
            throw e;
        }
    }
}
