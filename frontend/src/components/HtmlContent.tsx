import DOMPurify from 'dompurify';
import React, { useMemo } from 'react';

export interface HtmlContentProps {
  html: string;
  className?: string;
  maxLength?: number;
  showReadMore?: boolean;
}

/**
 * HtmlContent 컴포넌트
 * Sanitize된 HTML을 안전하게 렌더링하는 컴포넌트
 * XSS 방지를 위한 클라이언트 측 sanitization 포함
 */
const HtmlContent: React.FC<HtmlContentProps> = ({
  html,
  className = '',
  maxLength,
  showReadMore = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  /**
   * HTML Sanitization
   * XSS 공격 방지를 위해 위험한 HTML 태그와 속성을 제거
   */
  const sanitizeHtml = (content: string): string => {
    if (!content || content.trim() === '') {
      return '';
    }

    // DOMPurify 설정 (백엔드 정책과 일치)
    const config = {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        's',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'a',
        'blockquote',
        'code',
        'pre',
        'span',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'data-user-id'],
      ALLOW_DATA_ATTR: true, // data-* 속성 허용 (data-user-id를 위해 필수)
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
    };

    const sanitized = DOMPurify.sanitize(content, config);

    // 외부 링크에 보안 속성 추가
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;
    const links = tempDiv.querySelectorAll('a');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer nofollow');
      }
    });

    return tempDiv.innerHTML;
  };

  /**
   * 텍스트 길이 제한 처리
   */
  const processedHtml = useMemo(() => {
    const sanitized = sanitizeHtml(html);

    if (!maxLength || !showReadMore) {
      return sanitized;
    }

    // 텍스트 길이 계산 (HTML 태그 제외)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    // 길이 제한을 초과하지 않으면 그대로 반환
    if (textContent.length <= maxLength) {
      return sanitized;
    }

    // 확장되지 않은 상태에서 길이 제한 적용
    if (!isExpanded) {
      const truncatedText = textContent.substring(0, maxLength);
      return `<p>${truncatedText}...</p>`;
    }

    return sanitized;
  }, [html, maxLength, showReadMore, isExpanded]);

  /**
   * "더 보기" 버튼 표시 여부 결정
   */
  const shouldShowReadMore = useMemo(() => {
    if (!maxLength || !showReadMore) {
      return false;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizeHtml(html);
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    return textContent.length > maxLength;
  }, [html, maxLength, showReadMore]);

  /**
   * "더 보기" 버튼 클릭 핸들러
   */
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 빈 내용 처리
  if (!html || html.trim() === '') {
    return <div className={`html-content empty ${className}`}>내용이 없습니다.</div>;
  }

  return (
    <div className={`html-content ${className}`}>
      {/* Sanitize된 HTML 렌더링 */}
      <div
        className="ql-editor"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />

      {/* "더 보기" 버튼 */}
      {shouldShowReadMore && (
        <button
          type="button"
          onClick={handleToggleExpand}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none focus:underline transition-colors"
        >
          {isExpanded ? '접기' : '더 보기'}
        </button>
      )}
    </div>
  );
};

export default HtmlContent;
