package com.kanban.user;

import java.io.IOException;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.kanban.attachment.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth 프로필 이미지 다운로드 서비스 외부 URL(Google, Kakao 등)에서 프로필 이미지를 다운로드하여 로컬 저장소에 저장
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AvatarDownloadService {

    private final FileStorageService fileStorageService;
    private final RestTemplate restTemplate;

    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5MB
    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp");

    /**
     * 외부 URL에서 아바타 이미지를 다운로드하여 저장소에 저장
     *
     * @param externalUrl 외부 이미지 URL (예: Google profile image URL)
     * @param userId 사용자 ID
     * @return blob storage URL (내부용), 실패 시 null
     */
    public String downloadAndStore(String externalUrl, Long userId) {
        if (externalUrl == null || externalUrl.isBlank()) {
            log.debug("External avatar URL is null or blank for userId: {}", userId);
            return null;
        }

        try {
            log.info("Downloading avatar from external URL: userId={}, url={}", userId,
                    externalUrl);

            // 1. 외부 URL에서 이미지 다운로드
            ResponseEntity<byte[]> response = restTemplate.getForEntity(externalUrl, byte[].class);

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                log.warn("Failed to download avatar: userId={}, status={}", userId,
                        response.getStatusCode());
                return null;
            }

            byte[] imageData = response.getBody();

            // 2. 파일 크기 검증
            if (imageData.length > MAX_SIZE) {
                log.warn("Avatar image too large: userId={}, size={} bytes", userId,
                        imageData.length);
                return null;
            }

            // 3. Content-Type 검증
            String contentType = response.getHeaders().getContentType() != null
                    ? response.getHeaders().getContentType().toString()
                    : "unknown";

            if (!ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
                log.warn("Invalid avatar content type: userId={}, contentType={}", userId,
                        contentType);
                return null;
            }

            // 4. 파일 저장
            String path = "avatars/user-" + userId;
            String blobUrl =
                    fileStorageService.store(imageData, path, getFileExtension(contentType));

            log.info("Avatar downloaded and stored successfully: userId={}, blobUrl={}", userId,
                    blobUrl);
            return blobUrl;

        } catch (IOException e) {
            log.error("IOException while downloading avatar: userId={}, url={}", userId,
                    externalUrl, e);
            return null;
        } catch (Exception e) {
            log.error("Unexpected error while downloading avatar: userId={}, url={}", userId,
                    externalUrl, e);
            return null;
        }
    }

    /**
     * Content-Type에서 파일 확장자 추출
     */
    private String getFileExtension(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg"; // image/jpeg, image/jpg
        };
    }
}
