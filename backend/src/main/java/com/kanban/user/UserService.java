package com.kanban.user;

import com.kanban.exception.ResourceNotFoundException;
import com.kanban.file.FileStorageService;
import com.kanban.file.FileValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * 사용자 서비스
 * - 프로필 사진 업로드/삭제 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final FileValidator fileValidator;

    /**
     * 프로필 사진 업데이트
     * @param userId 사용자 ID
     * @param file 업로드된 파일
     * @return 새로운 아바타 URL
     */
    @Transactional
    public String updateAvatar(Long userId, MultipartFile file) {
        // 1. 파일 검증
        fileValidator.validateImageFile(file);

        // 2. 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다"));

        // 3. 기존 파일 삭제
        if (user.getAvatarUrl() != null) {
            try {
                fileStorageService.deleteAvatar(userId, user.getAvatarUrl());
            } catch (Exception e) {
                log.warn("Failed to delete existing avatar, continuing with upload: userId={}", userId, e);
            }
        }

        // 4. 새 파일 저장
        String newAvatarUrl = fileStorageService.saveAvatar(userId, file);

        // 5. DB 업데이트
        user.setAvatarUrl(newAvatarUrl);
        userRepository.save(user);

        log.info("Avatar updated successfully: userId={}, url={}", userId, newAvatarUrl);
        return newAvatarUrl;
    }

    /**
     * 프로필 사진 삭제
     * @param userId 사용자 ID
     */
    @Transactional
    public void deleteAvatar(Long userId) {
        // 1. 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다"));

        // 2. 아바타가 없으면 스킵
        if (user.getAvatarUrl() == null) {
            log.info("No avatar to delete: userId={}", userId);
            return;
        }

        // 3. 파일 삭제
        try {
            fileStorageService.deleteAvatar(userId, user.getAvatarUrl());
        } catch (Exception e) {
            log.error("Failed to delete avatar file, continuing with DB update: userId={}", userId, e);
        }

        // 4. DB 업데이트
        user.setAvatarUrl(null);
        userRepository.save(user);

        log.info("Avatar deleted successfully: userId={}", userId);
    }
}
