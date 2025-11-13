package com.kanban.file;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * 파일 저장 서비스
 * - 프로필 사진 저장/삭제
 * - 사용자별 디렉토리 관리
 */
@Slf4j
@Service
public class FileStorageService {

    @Value("${file.upload.path:uploads/avatars}")
    private String uploadBasePath;

    /**
     * 프로필 사진 저장
     * @param userId 사용자 ID
     * @param file 업로드된 파일
     * @return 저장된 파일의 URL
     */
    public String saveAvatar(Long userId, MultipartFile file) {
        try {
            // 1. 사용자별 디렉토리 생성
            Path userDir = Paths.get(uploadBasePath, "user-" + userId);
            Files.createDirectories(userDir);

            // 2. 기존 파일 삭제
            deleteExistingAvatarFiles(userDir);

            // 3. 파일명 생성 (UUID + 확장자)
            String extension = getFileExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + "-profile." + extension;

            // 4. 파일 저장
            Path filePath = userDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 5. URL 반환 (상대 경로)
            String avatarUrl = "/uploads/avatars/user-" + userId + "/" + filename;
            log.info("Avatar saved successfully: userId={}, url={}", userId, avatarUrl);
            return avatarUrl;

        } catch (IOException e) {
            log.error("Failed to save avatar: userId={}", userId, e);
            throw new FileStorageException("파일 저장에 실패했습니다", e);
        }
    }

    /**
     * 프로필 사진 삭제
     * @param userId 사용자 ID
     * @param avatarUrl 삭제할 아바타 URL
     */
    public void deleteAvatar(Long userId, String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isEmpty()) {
            return;
        }

        try {
            // URL에서 파일명 추출
            String filename = extractFilenameFromUrl(avatarUrl);
            Path filePath = Paths.get(uploadBasePath, "user-" + userId, filename);

            // 파일 삭제
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Avatar deleted successfully: userId={}, url={}", userId, avatarUrl);
            } else {
                log.warn("Avatar file not found: userId={}, path={}", userId, filePath);
            }

        } catch (IOException e) {
            log.error("Failed to delete avatar: userId={}, url={}", userId, avatarUrl, e);
            throw new FileStorageException("파일 삭제에 실패했습니다", e);
        }
    }

    /**
     * 디렉토리 내의 기존 프로필 사진 파일들 삭제
     */
    private void deleteExistingAvatarFiles(Path userDir) throws IOException {
        if (Files.exists(userDir)) {
            try (Stream<Path> files = Files.list(userDir)) {
                files.filter(path -> path.getFileName().toString().contains("-profile."))
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                                log.debug("Deleted existing avatar file: {}", path);
                            } catch (IOException e) {
                                log.warn("Failed to delete existing avatar file: {}", path, e);
                            }
                        });
            }
        }
    }

    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * URL에서 파일명 추출
     * 예: /uploads/avatars/user-1/abc123-profile.jpg -> abc123-profile.jpg
     */
    private String extractFilenameFromUrl(String url) {
        return url.substring(url.lastIndexOf("/") + 1);
    }
}
