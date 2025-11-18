package com.kanban.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * 이메일 템플릿 처리 유틸리티 클래스
 * HTML 템플릿 파일을 읽어와 변수를 치환합니다.
 */
@Slf4j
@Component
public class EmailTemplateUtil {

    /**
     * 템플릿 파일을 읽어와 변수를 치환합니다.
     *
     * @param templateName 템플릿 파일명 (확장자 제외)
     * @param variables 치환할 변수 맵 (key: {{key}}, value: 치환될 값)
     * @return 변수가 치환된 HTML 문자열
     * @throws IOException 템플릿 파일을 읽을 수 없는 경우
     */
    public String processTemplate(String templateName, Map<String, String> variables) throws IOException {
        String templatePath = "templates/" + templateName + ".html";
        ClassPathResource resource = new ClassPathResource(templatePath);

        if (!resource.exists()) {
            log.error("템플릿 파일을 찾을 수 없습니다: {}", templatePath);
            throw new IOException("템플릿 파일을 찾을 수 없습니다: " + templatePath);
        }

        String template = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        // 변수 치환
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            template = template.replace(placeholder, entry.getValue());
        }

        log.debug("템플릿 처리 완료: {}", templateName);
        return template;
    }

    /**
     * 이메일 인증 템플릿을 생성합니다.
     *
     * @param userName 사용자 이름
     * @param verificationUrl 인증 URL
     * @return 생성된 HTML 이메일 본문
     * @throws IOException 템플릿 파일을 읽을 수 없는 경우
     */
    public String createVerificationEmail(String userName, String verificationUrl) throws IOException {
        Map<String, String> variables = Map.of(
            "userName", userName,
            "verificationUrl", verificationUrl
        );

        return processTemplate("verification-email", variables);
    }
}
