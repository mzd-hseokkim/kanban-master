package com.kanban.attachment.service;

import java.io.IOException;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 저장소 서비스 인터페이스 (Local, S3 등으로 구현 가능)
 */
public interface FileStorageService {

    /**
     * 파일 저장
     * 
     * @param file 업로드된 파일
     * @return 저장된 파일명 (또는 경로)
     */
    String store(MultipartFile file) throws IOException;

    /**
     * 파일 로드
     * 
     * @param fileName 파일명
     * @return 파일 리소스
     */
    Resource load(String fileName) throws IOException;

    /**
     * 파일 삭제
     * 
     * @param fileName 파일명
     */
    void delete(String fileName) throws IOException;
}
