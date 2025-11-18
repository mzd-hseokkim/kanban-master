package com.kanban.util;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * EmailUtil 테스트 클래스
 * 실제 MailerSend API를 호출하여 이메일 발송을 테스트합니다.
 */
@SpringBootTest
@ActiveProfiles("dev")
class EmailUtilTest {

    @Autowired
    private EmailUtil emailUtil;

    @Test
    void testSendEmail() {
        // Given
        String toEmail = "hseokkim@mz.co.kr";
        String toName = "김형석";
        String subject = "[Kanban Board] 테스트 메일입니다";
        String htmlContent = """
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9fafb; }
                        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Kanban Board</h1>
                        </div>
                        <div class="content">
                            <h2>안녕하세요, %s님!</h2>
                            <p>MailerSend 이메일 발송 기능 테스트입니다.</p>
                            <p>이 메일이 정상적으로 도착했다면 이메일 발송 기능이 정상적으로 작동하는 것입니다.</p>
                            <h3>테스트 정보:</h3>
                            <ul>
                                <li><strong>발송 서비스:</strong> MailerSend</li>
                                <li><strong>발송 시간:</strong> %s</li>
                                <li><strong>수신자:</strong> %s</li>
                            </ul>
                            <p>감사합니다!</p>
                        </div>
                        <div class="footer">
                            <p>이 메일은 Kanban Board 시스템에서 자동으로 발송되었습니다.</p>
                            <p>&copy; 2025 Kanban Board. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                toName,
                java.time.LocalDateTime.now().toString(),
                toEmail
        );

        // When
        String messageId = emailUtil.sendEmail(toEmail, toName, subject, htmlContent);

        // Then
        assertNotNull(messageId, "메시지 ID가 null이 아니어야 합니다");
        assertFalse(messageId.isEmpty(), "메시지 ID가 비어있지 않아야 합니다");

        System.out.println("=".repeat(80));
        System.out.println("이메일 발송 성공!");
        System.out.println("수신자: " + toEmail);
        System.out.println("메시지 ID: " + messageId);
        System.out.println("=".repeat(80));
    }

    @Test
    void testSendTextEmail() {
        // Given
        String toEmail = "hseokkim@mz.co.kr";
        String subject = "[Kanban Board] 텍스트 메일 테스트";
        String textContent = """
                안녕하세요!

                이것은 간단한 텍스트 메일 테스트입니다.

                MailerSend를 통해 발송되었습니다.

                감사합니다.
                """;

        // When
        String messageId = emailUtil.sendTextEmail(toEmail, subject, textContent);

        // Then
        assertNotNull(messageId, "메시지 ID가 null이 아니어야 합니다");
        assertFalse(messageId.isEmpty(), "메시지 ID가 비어있지 않아야 합니다");

        System.out.println("=".repeat(80));
        System.out.println("텍스트 메일 발송 성공!");
        System.out.println("수신자: " + toEmail);
        System.out.println("메시지 ID: " + messageId);
        System.out.println("=".repeat(80));
    }
}
