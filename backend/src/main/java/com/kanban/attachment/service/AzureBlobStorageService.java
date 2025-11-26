package com.kanban.attachment.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

/**
 * Azure Blob Storage 구현체
 */
@Slf4j
public class AzureBlobStorageService implements FileStorageService {

    private final BlobServiceClient blobServiceClient;
    private final String containerName;
    private BlobContainerClient containerClient;

    public AzureBlobStorageService(String connectionString, String containerName) {
        this.blobServiceClient =
                new BlobServiceClientBuilder().connectionString(connectionString).buildClient();
        this.containerName = containerName;
    }

    @PostConstruct
    public void init() {
        log.info("========================================");
        log.info("Initializing AzureBlobStorageService");
        log.info("Container Name: {}", containerName);
        log.info("========================================");

        this.containerClient = blobServiceClient.getBlobContainerClient(containerName);

        if (!containerClient.exists()) {
            log.info("Container '{}' does not exist. Creating...", containerName);
            containerClient.create();
            log.info("✓ Created Azure Blob Container: {}", containerName);
        } else {
            log.info("✓ Container '{}' already exists", containerName);
        }

        log.info("✓ AzureBlobStorageService initialized successfully");
        log.info("========================================");
    }

    @Override
    public String store(MultipartFile file, String path) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("Failed to store empty file.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String storedFileName = UUID.randomUUID().toString() + extension;
        String blobName = path + "/" + storedFileName;

        BlobClient blobClient = containerClient.getBlobClient(blobName);

        try {
            blobClient.upload(file.getInputStream(), file.getSize(), true);
            log.info("Uploaded file to Azure Blob: {}", blobName);
        } catch (Exception e) {
            throw new IOException("Failed to upload file to Azure Blob", e);
        }

        return blobName;
    }

    @Override
    public String store(byte[] data, String path, String extension) throws IOException {
        if (data == null || data.length == 0) {
            throw new IOException("Failed to store empty data.");
        }

        String storedFileName = UUID.randomUUID().toString() + extension;
        String blobName = path + "/" + storedFileName;

        BlobClient blobClient = containerClient.getBlobClient(blobName);

        try {
            blobClient.upload(new java.io.ByteArrayInputStream(data), data.length, true);
            log.info("Uploaded byte array to Azure Blob: {} ({} bytes)", blobName, data.length);
        } catch (Exception e) {
            throw new IOException("Failed to upload byte array to Azure Blob", e);
        }

        return blobName;
    }

    @Override
    public Resource load(String path) throws IOException {
        BlobClient blobClient = containerClient.getBlobClient(path);

        if (!blobClient.exists()) {
            throw new IOException("File not found in Azure Blob: " + path);
        }

        try {
            // Azure SDK를 사용해서 blob 내용을 다운로드
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            blobClient.downloadStream(outputStream);
            byte[] data = outputStream.toByteArray();

            log.info("Downloaded blob: {} ({} bytes)", path, data.length);

            return new ByteArrayResource(data);
        } catch (Exception e) {
            throw new IOException("Failed to download blob: " + path, e);
        }
    }

    @Override
    public void delete(String path) throws IOException {
        BlobClient blobClient = containerClient.getBlobClient(path);
        if (blobClient.exists()) {
            blobClient.delete();
            log.info("Deleted file from Azure Blob: {}", path);
        }
    }

    @Override
    public void deleteByUrl(String url) throws IOException {
        // URL에서 path 추출
        // 예: https://account.blob.core.windows.net/container/path/to/file
        try {
            String blobUrlBase = containerClient.getBlobContainerUrl();
            if (url.startsWith(blobUrlBase)) {
                String path = url.substring(blobUrlBase.length() + 1); // +1 for slash
                delete(path);
            }
        } catch (Exception e) {
            log.warn("Failed to parse/delete by URL: {}", url, e);
        }
    }

    @Override
    public String getUrl(String path) {
        return containerClient.getBlobClient(path).getBlobUrl();
    }

    @Override
    public Resource loadAsResource(String url) throws IOException {
        // URL이 http로 시작하지 않으면 blob path로 간주
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return load(url);
        }

        // URL에서 path 추출
        try {
            String blobUrlBase = containerClient.getBlobContainerUrl();
            if (url.startsWith(blobUrlBase)) {
                String path = url.substring(blobUrlBase.length() + 1); // +1 for slash
                return load(path);
            }
            throw new IOException("Invalid Azure Blob URL: " + url);
        } catch (Exception e) {
            throw new IOException("Failed to load resource from URL: " + url, e);
        }
    }
}
