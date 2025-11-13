import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HtmlContent from '../HtmlContent';

describe('HtmlContent', () => {
  it('기본 렌더링이 정상적으로 이루어져야 함', () => {
    const validHtml = '<p>테스트 내용</p>';

    render(<HtmlContent html={validHtml} />);

    expect(screen.getByText('테스트 내용')).toBeInTheDocument();
  });

  it('빈 HTML은 "내용이 없습니다." 메시지를 표시해야 함', () => {
    render(<HtmlContent html="" />);

    expect(screen.getByText('내용이 없습니다.')).toBeInTheDocument();
  });

  it('허용된 HTML 태그는 정상적으로 렌더링되어야 함', () => {
    const validHtml =
      '<p><strong>굵은 글씨</strong></p><ul><li>항목 1</li><li>항목 2</li></ul>';

    const { container } = render(<HtmlContent html={validHtml} />);

    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('XSS 공격을 위한 script 태그는 제거되어야 함', () => {
    const maliciousHtml = '<p>안전한 내용</p><script>alert("XSS")</script>';

    const { container } = render(<HtmlContent html={maliciousHtml} />);

    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(screen.getByText('안전한 내용')).toBeInTheDocument();
  });

  it('XSS 공격을 위한 iframe 태그는 제거되어야 함', () => {
    const maliciousHtml = '<p>내용</p><iframe src="evil.com"></iframe>';

    const { container } = render(<HtmlContent html={maliciousHtml} />);

    expect(container.querySelector('iframe')).not.toBeInTheDocument();
    expect(screen.getByText('내용')).toBeInTheDocument();
  });

  it('XSS 공격을 위한 이벤트 핸들러는 제거되어야 함', () => {
    const maliciousHtml = '<p onclick="alert(\'XSS\')">클릭하세요</p>';

    const { container } = render(<HtmlContent html={maliciousHtml} />);

    const paragraph = container.querySelector('p');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph?.getAttribute('onclick')).toBeNull();
    expect(screen.getByText('클릭하세요')).toBeInTheDocument();
  });

  it('외부 링크에 보안 속성이 추가되어야 함', () => {
    const linkHtml = '<a href="https://example.com">링크</a>';

    const { container } = render(<HtmlContent html={linkHtml} />);

    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
    expect(link?.getAttribute('rel')).toContain('noreferrer');
    expect(link?.getAttribute('rel')).toContain('nofollow');
  });

  it('javascript: 프로토콜은 제거되어야 함', () => {
    const maliciousHtml = '<a href="javascript:alert(\'XSS\')">링크</a>';

    const { container } = render(<HtmlContent html={maliciousHtml} />);

    const link = container.querySelector('a');
    const href = link?.getAttribute('href');
    // href가 null이거나 javascript:를 포함하지 않아야 함
    expect(href === null || (href !== undefined && !href.includes('javascript:'))).toBe(true);
  });

  it('허용된 링크 프로토콜(https, http)은 유지되어야 함', () => {
    const validHtml = '<a href="https://example.com">링크</a>';

    const { container } = render(<HtmlContent html={validHtml} />);

    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.com');
  });

  it('maxLength가 설정된 경우 텍스트가 잘려야 함', () => {
    const longHtml = '<p>' + 'a'.repeat(200) + '</p>';

    render(<HtmlContent html={longHtml} maxLength={100} showReadMore />);

    const content = screen.getByText(/a+\.\.\./);
    expect(content.textContent?.length).toBeLessThan(200);
  });

  it('maxLength보다 짧은 내용은 그대로 표시되어야 함', () => {
    const shortHtml = '<p>짧은 내용</p>';

    render(<HtmlContent html={shortHtml} maxLength={100} showReadMore />);

    expect(screen.getByText('짧은 내용')).toBeInTheDocument();
    expect(screen.queryByText('더 보기')).not.toBeInTheDocument();
  });

  it('"더 보기" 버튼 클릭 시 전체 내용이 표시되어야 함', async () => {
    const user = userEvent.setup();
    const longHtml = '<p>' + 'a'.repeat(200) + '</p>';

    render(<HtmlContent html={longHtml} maxLength={100} showReadMore />);

    // 초기에는 잘린 내용
    expect(screen.getByText(/a+\.\.\./)).toBeInTheDocument();
    expect(screen.getByText('더 보기')).toBeInTheDocument();

    // "더 보기" 클릭
    const button = screen.getByText('더 보기');
    await user.click(button);

    // 전체 내용 표시 및 버튼 텍스트 변경
    expect(screen.getByText('접기')).toBeInTheDocument();
  });

  it('"접기" 버튼 클릭 시 다시 잘린 내용이 표시되어야 함', async () => {
    const user = userEvent.setup();
    const longHtml = '<p>' + 'a'.repeat(200) + '</p>';

    render(<HtmlContent html={longHtml} maxLength={100} showReadMore />);

    // "더 보기" 클릭하여 확장
    const readMoreButton = screen.getByText('더 보기');
    await user.click(readMoreButton);

    // "접기" 클릭
    const collapseButton = screen.getByText('접기');
    await user.click(collapseButton);

    // 다시 잘린 내용과 "더 보기" 버튼
    expect(screen.getByText('더 보기')).toBeInTheDocument();
  });

  it('showReadMore가 false이면 "더 보기" 버튼이 표시되지 않아야 함', () => {
    const longHtml = '<p>' + 'a'.repeat(200) + '</p>';

    render(<HtmlContent html={longHtml} maxLength={100} showReadMore={false} />);

    expect(screen.queryByText('더 보기')).not.toBeInTheDocument();
  });

  it('className prop이 컨테이너에 적용되어야 함', () => {
    const validHtml = '<p>테스트</p>';

    const { container } = render(
      <HtmlContent html={validHtml} className="custom-class" />
    );

    const htmlContentDiv = container.querySelector('.html-content');
    expect(htmlContentDiv).toHaveClass('custom-class');
  });

  it('코드 블록이 정상적으로 렌더링되어야 함', () => {
    const codeHtml = '<pre><code>const x = 1;</code></pre>';

    const { container } = render(<HtmlContent html={codeHtml} />);

    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('인용문이 정상적으로 렌더링되어야 함', () => {
    const quoteHtml = '<blockquote>인용문</blockquote>';

    const { container } = render(<HtmlContent html={quoteHtml} />);

    expect(container.querySelector('blockquote')).toBeInTheDocument();
    expect(screen.getByText('인용문')).toBeInTheDocument();
  });

  it('제목 태그가 정상적으로 렌더링되어야 함', () => {
    const headingHtml = '<h1>제목 1</h1><h2>제목 2</h2><h3>제목 3</h3>';

    const { container } = render(<HtmlContent html={headingHtml} />);

    expect(container.querySelector('h1')).toBeInTheDocument();
    expect(container.querySelector('h2')).toBeInTheDocument();
    expect(container.querySelector('h3')).toBeInTheDocument();
    expect(screen.getByText('제목 1')).toBeInTheDocument();
    expect(screen.getByText('제목 2')).toBeInTheDocument();
    expect(screen.getByText('제목 3')).toBeInTheDocument();
  });

  it('텍스트 서식이 정상적으로 렌더링되어야 함', () => {
    const formattedHtml =
      '<p><strong>굵게</strong> <em>기울임</em> <u>밑줄</u> <s>취소선</s></p>';

    const { container } = render(<HtmlContent html={formattedHtml} />);

    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('em')).toBeInTheDocument();
    expect(container.querySelector('u')).toBeInTheDocument();
    expect(container.querySelector('s')).toBeInTheDocument();
  });
});
