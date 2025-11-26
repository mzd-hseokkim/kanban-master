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
     * @param path 저장할 경로 (예: "avatars/user-1")
     * @return 저장된 파일의 전체 경로 (또는 URL)
     */
    String store(MultipartFile file, String path) throws IOException;

    /**
     * byte 배열로 파일 저장 (OAuth 아바타 다운로드용)
     *
     * @param data 파일 데이터
     * @param path 저장할 경로 (예: "avatars/user-1")
     * @param extension 파일 확장자 (예: ".jpg")
     * @return 저장된 파일의 전체 경로 (또는 URL)
     */
    String store(byte[] data, String path, String extension) throws IOException;

    /**
     * 파일 로드
     *
     * @param path 파일 경로
     * @return 파일 리소스
     */
    Resource load(String path) throws IOException;

    /**
     * 파일 삭제
     *
     * @param path 파일 경로 (Key)
     */
    void delete(String path) throws IOException;

    /**
     * URL로 파일 삭제
     *
     * @param url 파일 URL
     */
    void deleteByUrl(String url) throws IOException;

    /**
     * 파일 접근 URL 생성
     *
     * @param path 파일 경로 (Key)
     * @return 접근 가능한 URL
     */
    String getUrl(String path);

    /**
     * URL로 파일 리소스 로드
     *
     * @param url 파일 URL
     * @return 파일 리소스
     */
    Resource loadAsResource(String url) throws IOException;
}
