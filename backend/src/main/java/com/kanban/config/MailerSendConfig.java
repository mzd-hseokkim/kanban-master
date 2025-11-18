package com.kanban.config;

import com.mailersend.sdk.MailerSend;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MailerSend 설정 클래스
 * MailerSend API를 사용하여 이메일을 발송하기 위한 Bean을 생성합니다.
 */
@Configuration
public class MailerSendConfig {

    @Value("${mailersend.api.token}")
    private String apiToken;

    /**
     * MailerSend 인스턴스를 생성하고 API 토큰을 설정합니다.
     *
     * @return MailerSend 인스턴스
     */
    @Bean
    public MailerSend mailerSend() {
        MailerSend ms = new MailerSend();
        ms.setToken(apiToken);
        return ms;
    }
}
