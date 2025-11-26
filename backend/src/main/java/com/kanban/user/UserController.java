package com.kanban.user;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.kanban.common.SecurityUtil;
import com.kanban.user.dto.AvatarUploadResponse;
import com.kanban.user.dto.UserSearchResponse;
import lombok.RequiredArgsConstructor;

/**
 * 사용자 관련 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    /**
     * 사용자 검색 (이름 또는 이메일)
     *
     * @param keyword 검색 키워드
     * @return 검색된 사용자 목록
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<User> users = userRepository.searchByNameOrEmail(keyword.trim());
        List<UserSearchResponse> responses = users.stream().map(user -> {
            // Convert avatarUrl to proxy URL for consistent access
            String avatarUrl = user.getAvatarUrl();
            if (avatarUrl != null && !avatarUrl.startsWith("/users/")) {
                // blob URL이면 프록시 URL로 변환
                avatarUrl = "/users/" + user.getId() + "/avatar";
            }
            return UserSearchResponse.builder().id(user.getId()).name(user.getName())
                    .email(user.getEmail()).avatarUrl(avatarUrl).build();
        }).toList();

        return ResponseEntity.ok(responses);
    }

    /**
     * 프로필 사진 업로드
     *
     * @param file 업로드할 이미지 파일
     * @return 업로드된 아바타 URL 정보
     */
    @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AvatarUploadResponse> uploadAvatar(
            @RequestParam("file") MultipartFile file) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        String avatarUrl = userService.updateAvatar(currentUserId, file);

        AvatarUploadResponse response = AvatarUploadResponse.builder().avatarUrl(avatarUrl)
                .uploadedAt(LocalDateTime.now()).build();

        return ResponseEntity.ok(response);
    }

    /**
     * 프로필 사진 삭제
     *
     * @return 204 No Content
     */
    @DeleteMapping("/profile/avatar")
    public ResponseEntity<Void> deleteAvatar() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        userService.deleteAvatar(currentUserId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 아바타 이미지 다운로드 (공개 접근)
     *
     * @param userId 사용자 ID
     * @return 아바타 이미지 파일
     */
    @GetMapping("/{userId}/avatar")
    public ResponseEntity<Resource> downloadAvatar(@PathVariable Long userId) throws IOException {
        Resource resource = userService.downloadAvatar(userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // 아바타가 없으면 404
        if (user.getAvatarUrl() == null) {
            return ResponseEntity.notFound().build();
        }

        // Content-Type 결정 (확장자 기반)
        String contentType = "image/jpeg"; // 기본값
        String avatarUrl = user.getAvatarUrl();
        if (avatarUrl.toLowerCase().endsWith(".png")) {
            contentType = "image/png";
        } else if (avatarUrl.toLowerCase().endsWith(".gif")) {
            contentType = "image/gif";
        } else if (avatarUrl.toLowerCase().endsWith(".webp")) {
            contentType = "image/webp";
        }

        return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000") // 1년 캐싱
                .body(resource);
    }
}
