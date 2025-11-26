package com.kanban.attachment.service;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;

/**
 * 로컬 파일 시스템 저장소 구현체
 */
@Service
public class LocalFileStorageService implements FileStorageService {

    private final Path rootLocation;

    public LocalFileStorageService(
            @Value("${file.upload-dir:uploads/attachments}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir);
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new IllegalStateException("Could not initialize storage location", e);
        }
    }

    @Override
    public String store(MultipartFile file, String path) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("Failed to store empty file.");
        }

        // 원본 파일명에서 확장자 추출
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // UUID로 고유한 파일명 생성
        String storedFileName = UUID.randomUUID().toString() + extension;

        // 저장 경로 생성 (rootLocation + path)
        Path uploadPath = this.rootLocation.resolve(path);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path destinationFile =
                uploadPath.resolve(Paths.get(storedFileName)).normalize().toAbsolutePath();

        if (!destinationFile.getParent().startsWith(this.rootLocation.toAbsolutePath())) {
            // 보안 검사: 상위 디렉토리 접근 방지
            throw new IOException("Cannot store file outside current directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
        }

        // 저장된 상대 경로 반환 (path/filename)
        return path + "/" + storedFileName;
    }

    @Override
    public String store(byte[] data, String path, String extension) throws IOException {
        if (data == null || data.length == 0) {
            throw new IOException("Failed to store empty data.");
        }

        // UUID로 고유한 파일명 생성
        String storedFileName = UUID.randomUUID().toString() + extension;

        // 저장 경로 생성 (rootLocation + path)
        Path uploadPath = this.rootLocation.resolve(path);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path destinationFile =
                uploadPath.resolve(Paths.get(storedFileName)).normalize().toAbsolutePath();

        if (!destinationFile.getParent().startsWith(this.rootLocation.toAbsolutePath())) {
            // 보안 검사: 상위 디렉토리 접근 방지
            throw new IOException("Cannot store file outside current directory.");
        }

        Files.write(destinationFile, data);

        // 저장된 상대 경로 반환 (path/filename)
        return path + "/" + storedFileName;
    }

    @Override
    public Resource load(String path) throws IOException {
        try {
            Path file = rootLocation.resolve(path);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new IOException("Could not read file: " + path);
            }
        } catch (MalformedURLException e) {
            throw new IOException("Could not read file: " + path, e);
        }
    }

    @Override
    public void delete(String path) throws IOException {
        Path file = rootLocation.resolve(path);
        Files.deleteIfExists(file);
    }

    @Override
    public void deleteByUrl(String url) throws IOException {
        // URL에서 path 추출 (/uploads/ 제거)
        if (url != null && url.startsWith("/uploads/")) {
            String path = url.substring("/uploads/".length());
            delete(path);
        }
    }

    @Override
    public String getUrl(String path) {
        return "/uploads/" + path;
    }

    @Override
    public Resource loadAsResource(String url) throws IOException {
        // URL에서 path 추출 (/uploads/ 제거)
        if (url != null && url.startsWith("/uploads/")) {
            String path = url.substring("/uploads/".length());
            return load(path);
        }
        throw new IOException("Invalid URL format: " + url);
    }
}
