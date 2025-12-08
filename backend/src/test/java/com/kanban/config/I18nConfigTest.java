package com.kanban.config;

import com.kanban.util.MessageSourceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.ResourceBundleMessageSource;

import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * I18nConfig 및 MessageSourceService 테스트
 * 다국어 지원(i18n) 설정 및 메시지 조회 기능 검증
 */
class I18nConfigTest {

    private MessageSource messageSource;
    private MessageSourceService messageSourceService;

    @BeforeEach
    void setUp() {
        // I18nConfig와 동일한 설정으로 MessageSource 생성
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("messages");
        source.setDefaultEncoding("UTF-8");
        source.setUseCodeAsDefaultMessage(true);
        source.setCacheSeconds(0); // 테스트에서는 캐싱 비활성화

        messageSource = source;
        messageSourceService = new MessageSourceService(messageSource);

        // LocaleContextHolder 초기화 (테스트 간 격리)
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    @DisplayName("영어 메시지가 올바르게 조회되어야 함")
    void shouldRetrieveEnglishMessage() {
        // given
        LocaleContextHolder.setLocale(Locale.ENGLISH);

        // when
        String message = messageSourceService.getMessage("test.message.hello");

        // then
        assertThat(message).isEqualTo("Hello, World!");
    }

    @Test
    @DisplayName("한국어 메시지가 올바르게 조회되어야 함")
    void shouldRetrieveKoreanMessage() {
        // given
        LocaleContextHolder.setLocale(Locale.KOREAN);

        // when
        String message = messageSourceService.getMessage("test.message.hello");

        // then
        assertThat(message).isEqualTo("안녕하세요!");
    }

    @Test
    @DisplayName("파라미터가 포함된 영어 메시지가 올바르게 조회되어야 함")
    void shouldRetrieveEnglishMessageWithParameter() {
        // given
        LocaleContextHolder.setLocale(Locale.ENGLISH);

        // when
        String message = messageSourceService.getMessage("test.message.welcome", "John");

        // then
        assertThat(message).isEqualTo("Welcome to Kanban Board, John!");
    }

    @Test
    @DisplayName("파라미터가 포함된 한국어 메시지가 올바르게 조회되어야 함")
    void shouldRetrieveKoreanMessageWithParameter() {
        // given
        LocaleContextHolder.setLocale(Locale.KOREAN);

        // when
        String message = messageSourceService.getMessage("test.message.welcome", "홍길동");

        // then
        assertThat(message).isEqualTo("칸반 보드에 오신 것을 환영합니다, 홍길동님!");
    }

    @Test
    @DisplayName("여러 파라미터가 올바르게 처리되어야 함")
    void shouldHandleMultipleParameters() {
        // given
        LocaleContextHolder.setLocale(Locale.ENGLISH);

        // when
        String message = messageSourceService.getMessage("test.message.parameter", "first", "second", "third");

        // then
        assertThat(message).isEqualTo("Parameter test: first, second, third");
    }

    @Test
    @DisplayName("존재하지 않는 메시지 코드는 코드 자체를 반환해야 함")
    void shouldReturnCodeForNonExistentMessage() {
        // given
        LocaleContextHolder.setLocale(Locale.ENGLISH);

        // when
        String message = messageSourceService.getMessage("non.existent.key");

        // then
        // useCodeAsDefaultMessage=true 설정으로 인해 코드를 반환
        assertThat(message).isEqualTo("non.existent.key");
    }

    @Test
    @DisplayName("getMessageOrDefault는 메시지 코드를 반환해야 함 (useCodeAsDefaultMessage=true)")
    void shouldReturnCodeWhenMessageNotFound() {
        // given
        LocaleContextHolder.setLocale(Locale.ENGLISH);

        // when
        // useCodeAsDefaultMessage=true이므로 NoSuchMessageException이 발생하지 않음
        // 따라서 getMessageOrDefault는 코드 자체를 반환
        String message = messageSourceService.getMessageOrDefault("non.existent.key", "Default Message");

        // then
        assertThat(message).isEqualTo("non.existent.key");
    }

    @Test
    @DisplayName("지원하지 않는 로케일은 기본 번들로 폴백되어야 함")
    void shouldFallbackToDefaultBundleForUnsupportedLocale() {
        // given
        Locale unsupportedLocale = Locale.FRENCH;
        LocaleContextHolder.setLocale(unsupportedLocale);

        // when
        // MessageSource를 직접 호출하여 명시적으로 로케일 전달
        String message = messageSource.getMessage("test.message.hello", null, unsupportedLocale);

        // then
        // 프랑스어는 지원하지 않으므로 messages.properties (기본 번들)로 폴백
        assertThat(message).isEqualTo("Hello, World!");
    }
}
