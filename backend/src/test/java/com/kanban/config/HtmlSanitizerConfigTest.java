package com.kanban.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.owasp.html.PolicyFactory;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * HtmlSanitizerConfig 테스트
 * XSS 공격 방지를 위한 HTML Sanitization 정책 검증
 */
class HtmlSanitizerConfigTest {

    private PolicyFactory policyFactory;

    @BeforeEach
    void setUp() {
        HtmlSanitizerConfig config = new HtmlSanitizerConfig();
        policyFactory = config.htmlSanitizerPolicy();
    }

    @Test
    @DisplayName("정상적인 HTML 태그는 허용되어야 함")
    void shouldAllowValidHtmlTags() {
        // given
        String validHtml = "<p><strong>굵은 텍스트</strong></p><ul><li>항목 1</li></ul>";

        // when
        String sanitized = policyFactory.sanitize(validHtml);

        // then
        assertThat(sanitized).contains("<p>", "<strong>", "</strong>", "</p>");
        assertThat(sanitized).contains("<ul>", "<li>", "</li>", "</ul>");
    }

    @Test
    @DisplayName("스크립트 태그는 제거되어야 함")
    void shouldRemoveScriptTags() {
        // given
        String maliciousHtml = "<p>안전한 내용</p><script>alert('XSS')</script>";

        // when
        String sanitized = policyFactory.sanitize(maliciousHtml);

        // then
        assertThat(sanitized).contains("<p>안전한 내용</p>");
        assertThat(sanitized).doesNotContain("<script>");
        assertThat(sanitized).doesNotContain("alert");
    }

    @Test
    @DisplayName("iframe 태그는 제거되어야 함")
    void shouldRemoveIframeTags() {
        // given
        String maliciousHtml = "<p>내용</p><iframe src=\"evil.com\"></iframe>";

        // when
        String sanitized = policyFactory.sanitize(maliciousHtml);

        // then
        assertThat(sanitized).contains("<p>내용</p>");
        assertThat(sanitized).doesNotContain("<iframe>");
        assertThat(sanitized).doesNotContain("evil.com");
    }

    @Test
    @DisplayName("onclick 등 이벤트 핸들러는 제거되어야 함")
    void shouldRemoveEventHandlers() {
        // given
        String maliciousHtml = "<p onclick=\"alert('XSS')\">클릭하세요</p>";

        // when
        String sanitized = policyFactory.sanitize(maliciousHtml);

        // then
        assertThat(sanitized).contains("<p>클릭하세요</p>");
        assertThat(sanitized).doesNotContain("onclick");
        assertThat(sanitized).doesNotContain("alert");
    }

    @Test
    @DisplayName("img 태그의 onerror 속성은 제거되어야 함")
    void shouldRemoveImageOnerrorAttribute() {
        // given
        String maliciousHtml = "<img src=x onerror=alert('XSS')>";

        // when
        String sanitized = policyFactory.sanitize(maliciousHtml);

        // then
        assertThat(sanitized).doesNotContain("<img");
        assertThat(sanitized).doesNotContain("onerror");
        assertThat(sanitized).doesNotContain("alert");
    }

    @Test
    @DisplayName("javascript: 프로토콜은 제거되어야 함")
    void shouldRemoveJavascriptProtocol() {
        // given
        String maliciousHtml = "<a href=\"javascript:alert('XSS')\">링크</a>";

        // when
        String sanitized = policyFactory.sanitize(maliciousHtml);

        // then
        assertThat(sanitized).contains("링크");
        assertThat(sanitized).doesNotContain("javascript:");
        assertThat(sanitized).doesNotContain("alert");
    }

    @Test
    @DisplayName("style 태그는 제거되어야 함")
    void shouldRemoveStyleTags() {
        // given
        String maliciousHtml = "<p>내용</p><style>body{display:none}</style>";

        // when
        String sanitized = policyFactory.sanitize(maliciousHtml);

        // then
        assertThat(sanitized).contains("<p>내용</p>");
        assertThat(sanitized).doesNotContain("<style>");
        assertThat(sanitized).doesNotContain("display:none");
    }

    @Test
    @DisplayName("허용된 링크는 유지되어야 함")
    void shouldAllowValidLinks() {
        // given
        String validHtml = "<a href=\"https://example.com\" target=\"_blank\" rel=\"noopener noreferrer\">링크</a>";

        // when
        String sanitized = policyFactory.sanitize(validHtml);

        // then
        assertThat(sanitized).contains("<a");
        assertThat(sanitized).contains("href");
        assertThat(sanitized).contains("example.com");
        assertThat(sanitized).contains("링크");
        assertThat(sanitized).contains("rel"); // requireRelNofollowOnLinks() 적용
    }

    @Test
    @DisplayName("코드 블록은 허용되어야 함")
    void shouldAllowCodeBlocks() {
        // given
        String validHtml = "<pre><code>const x = 1;</code></pre>";

        // when
        String sanitized = policyFactory.sanitize(validHtml);

        // then
        assertThat(sanitized).contains("<pre>");
        assertThat(sanitized).contains("<code>");
        // OWASP sanitizer는 특수문자를 HTML 엔티티로 변환할 수 있음
        assertThat(sanitized).containsAnyOf("const x = 1;", "const x &#61; 1;");
        assertThat(sanitized).contains("</code>");
        assertThat(sanitized).contains("</pre>");
    }

    @Test
    @DisplayName("blockquote는 허용되어야 함")
    void shouldAllowBlockquotes() {
        // given
        String validHtml = "<blockquote>인용문</blockquote>";

        // when
        String sanitized = policyFactory.sanitize(validHtml);

        // then
        assertThat(sanitized).contains("<blockquote>");
        assertThat(sanitized).contains("인용문");
    }

    @Test
    @DisplayName("null이나 빈 문자열은 그대로 반환되어야 함")
    void shouldHandleNullAndEmptyStrings() {
        // when & then
        // OWASP sanitizer는 null을 빈 문자열로 반환함
        assertThat(policyFactory.sanitize(null)).isEmpty();
        assertThat(policyFactory.sanitize("")).isEmpty();
        assertThat(policyFactory.sanitize("   ")).isEqualTo("   ");
    }

    @Test
    @DisplayName("복합적인 XSS 공격 시나리오는 모두 제거되어야 함")
    void shouldRemoveComplexXssAttacks() {
        // given
        String maliciousHtml = "<p>정상 내용</p>" +
                "<script>alert('XSS')</script>" +
                "<img src=x onerror=alert('XSS')>" +
                "<iframe src=\"evil.com\"></iframe>" +
                "<a href=\"javascript:alert('XSS')\">링크</a>" +
                "<p onclick=\"alert('XSS')\">클릭</p>" +
                "<style>body{display:none}</style>";

        // when
        String sanitized = policyFactory.sanitize(maliciousHtml);

        // then
        assertThat(sanitized).contains("<p>정상 내용</p>");
        assertThat(sanitized).contains("<p>클릭</p>");
        assertThat(sanitized).doesNotContain("<script>");
        assertThat(sanitized).doesNotContain("<iframe>");
        assertThat(sanitized).doesNotContain("<img");
        assertThat(sanitized).doesNotContain("<style>");
        assertThat(sanitized).doesNotContain("javascript:");
        assertThat(sanitized).doesNotContain("onclick");
        assertThat(sanitized).doesNotContain("onerror");
        assertThat(sanitized).doesNotContain("alert");
    }
}
