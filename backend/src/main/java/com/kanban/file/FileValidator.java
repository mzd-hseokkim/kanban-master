package com.kanban.file;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 파일 검증 컴포넌트
 * - 파일 크기 검증
 * - MIME 타입 검증
 * - 파일 확장자 검증
 */
@Component
public class FileValidator {

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private static final List<String> ALLOWED_EXTENSIONS = List.of(
            "jpg", "jpeg", "png", "gif", "webp"
    );

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5MB

    /**
     * 이미지 파일 검증
     * @param file 업로드된 파일
     * @throws InvalidFileException 검증 실패 시
     */
    public void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("파일이 비어있습니다");
        }

        // 크기 검증
        validateFileSize(file);

        // MIME 타입 검증
        validateMimeType(file);

        // 파일명 및 확장자 검증
        validateFilename(file);
    }

    /**
     * 파일 크기 검증 (5MB 이하)
     */
    private void validateFileSize(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileTooLargeException("파일 크기는 5MB 이하여야 합니다");
        }
    }

    /**
     * MIME 타입 검증
     */
    private void validateMimeType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new UnsupportedFileTypeException(
                    "지원하지 않는 파일 형식입니다 (jpg, png, gif, webp만 가능)"
            );
        }
    }

    /**
     * 파일명 및 확장자 검증
     */
    private void validateFilename(MultipartFile file) {
        String filename = file.getOriginalFilename();

        if (filename == null || filename.trim().isEmpty()) {
            throw new InvalidFileException("유효하지 않은 파일명입니다");
        }

        // 확장자 추출 및 검증
        if (!hasValidExtension(filename)) {
            throw new InvalidFileException(
                    "유효하지 않은 파일 확장자입니다 (jpg, png, gif, webp만 가능)"
            );
        }
    }

    /**
     * 유효한 확장자인지 확인
     */
    private boolean hasValidExtension(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        return ALLOWED_EXTENSIONS.contains(extension);
    }

    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
