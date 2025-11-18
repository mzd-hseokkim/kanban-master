package com.kanban.util;

import com.kanban.exception.EmailSendException;
import com.mailersend.sdk.MailerSend;
import com.mailersend.sdk.emails.Email;
import com.mailersend.sdk.MailerSendResponse;
import com.mailersend.sdk.exceptions.MailerSendException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 이메일 발송 유틸리티 클래스
 * MailerSend API를 사용하여 이메일을 발송합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailUtil {

    private final MailerSend mailerSend;

    @Value("${mailersend.from.email}")
    private String fromEmail;

    @Value("${mailersend.from.name}")
    private String fromName;

    /**
     * 기본 이메일을 발송합니다.
     *
     * @param toEmail 수신자 이메일 주소
     * @param toName 수신자 이름
     * @param subject 이메일 제목
     * @param htmlContent HTML 형식의 이메일 내용
     * @return 발송된 메시지 ID
     * @throws EmailSendException 이메일 발송 실패 시
     */
    public String sendEmail(String toEmail, String toName, String subject, String htmlContent) {
        try {
            Email email = new Email();

            // 발신자 설정
            email.setFrom(fromName, fromEmail);

            // 수신자 설정
            email.addRecipient(toName, toEmail);

            // 제목 및 내용 설정
            email.setSubject(subject);
            email.setHtml(htmlContent);

            // 텍스트 버전도 제공 (이메일 클라이언트 호환성을 위해)
            email.setPlain(stripHtml(htmlContent));

            // 이메일 전송
            MailerSendResponse response = mailerSend.emails().send(email);

            log.info("이메일 발송 성공 - 수신자: {}, 메시지 ID: {}", toEmail, response.messageId);

            // 메시지 ID 반환
            return response.messageId;

        } catch (MailerSendException e) {
            log.error("이메일 발송 실패 - 수신자: {}, 오류: {}", toEmail, e.getMessage(), e);
            throw new EmailSendException("이메일 발송에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 간단한 텍스트 이메일을 발송합니다.
     *
     * @param toEmail 수신자 이메일 주소
     * @param subject 이메일 제목
     * @param textContent 텍스트 내용
     * @return 발송된 메시지 ID
     * @throws EmailSendException 이메일 발송 실패 시
     */
    public String sendTextEmail(String toEmail, String subject, String textContent) {
        String htmlContent = textContent.replace("\n", "<br>");
        return sendEmail(toEmail, toEmail, subject, htmlContent);
    }

    /**
     * HTML 태그를 제거하여 순수 텍스트로 변환합니다.
     *
     * @param html HTML 문자열
     * @return 순수 텍스트 문자열
     */
    private String stripHtml(String html) {
        if (html == null) {
            return "";
        }
        return html.replaceAll("<[^>]*>", "")
                   .replaceAll("&nbsp;", " ")
                   .replaceAll("&amp;", "&")
                   .replaceAll("&lt;", "<")
                   .replaceAll("&gt;", ">")
                   .trim();
    }
}
