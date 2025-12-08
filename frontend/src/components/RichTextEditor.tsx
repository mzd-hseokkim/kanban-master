import DOMPurify from 'dompurify';
import 'quill/dist/quill.snow.css';
import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import { useTranslation } from 'react-i18next';
import '../styles/quill-custom.css';

type ReactQuillPrototype = {
  getEditingArea: () => Element;
  editingArea?: Element | null;
  __hasEditingAreaPatch?: boolean;
};

const reactQuillPrototype = (ReactQuill as unknown as { prototype?: ReactQuillPrototype }).prototype;

if (reactQuillPrototype && !reactQuillPrototype.__hasEditingAreaPatch) {
  const originalGetEditingArea = reactQuillPrototype.getEditingArea;

  reactQuillPrototype.getEditingArea = function getEditingAreaPatched(this: ReactQuillPrototype) {
    const element = this.editingArea;
    if (element && typeof element.nodeType === 'number' && element.nodeType !== 3) {
      return element;
    }
    return originalGetEditingArea.call(this);
  };

  reactQuillPrototype.__hasEditingAreaPatch = true;
}

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  error?: boolean;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  skipSanitization?: boolean;
}

/**
 * RichTextEditor 컴포넌트
 * Quill 에디터를 래핑한 재사용 가능한 리치 텍스트 에디터
 * XSS 방지를 위한 클라이언트 측 sanitization 포함
 */
const RichTextEditor = React.forwardRef<ReactQuill, RichTextEditorProps>(({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  readOnly = false,
  error = false,
  disabled = false,
  maxLength = 50000,
  className = '',
  skipSanitization = false,
}, ref) => {
  const internalRef = useRef<ReactQuill>(null);
  const { t, i18n } = useTranslation(['common']);

  // Combine refs
  React.useImperativeHandle(ref, () => internalRef.current as ReactQuill);

  // Quill 모듈 설정 (툴바 옵션)
  const modules = useMemo(
    () => ({
      toolbar: readOnly
        ? false
        : [
            // 텍스트 서식
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],

            // 목록
            [{ list: 'ordered' }, { list: 'bullet' }],

            // 링크
            ['link'],

            // 인용 및 코드
            ['blockquote', 'code-block'],

            // 정리
            ['clean'],
          ],
      clipboard: {
        // 붙여넣기 시 불필요한 스타일 제거
        matchVisual: false,
      },
    }),
    [readOnly]
  );

  // Quill 포맷 설정 (허용된 포맷)
  // 컴포넌트 외부로 이동하거나 useMemo를 사용하여 참조 안정성 확보 필요
  // 여기서는 useMemo를 사용
  const formats = useMemo(() => [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    'blockquote',
    'code-block',
    'mention',
  ], []);

  /**
   * HTML Sanitization
   * XSS 공격 방지를 위해 위험한 HTML 태그와 속성을 제거
   */
  const sanitizeHtml = (html: string): string => {
    if (!html || html.trim() === '' || html === '<p><br></p>') {
      return '';
    }

    // DOMPurify 설정
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
        'span', // 멘션 태그 허용
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'data-user-id', 'contenteditable'], // 멘션 속성 및 contenteditable 허용
      ALLOW_DATA_ATTR: true, // data-* 속성 허용 (data-user-id를 위해 필수)
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
    };

    const sanitized = DOMPurify.sanitize(html, config);

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
   * 에디터 내용 변경 핸들러
   */
  const handleChange = (content: string) => {
    // 빈 에디터 상태 체크 (Quill의 빈 상태는 '<p><br></p>')
    if (content === '<p><br></p>') {
      onChange('');
      return;
    }

    // 길이 제한 체크
    const editor = internalRef.current?.getEditor();
    if (editor && maxLength) {
      const textLength = editor.getText().length - 1; // Quill은 마지막에 \n을 추가하므로 -1
      if (textLength > maxLength) {
        // 최대 길이 초과 시 더 이상 입력 불가
        return;
      }
    }

    // Sanitize 후 onChange 호출 (skipSanitization 옵션 확인)
    const finalContent = skipSanitization ? content : sanitizeHtml(content);
    onChange(finalContent);
  };

  /**
   * 에디터 컨테이너 클래스 설정
   */
  const containerClassName = [
    'quill-editor-container',
    readOnly && 'readonly',
    error && 'error',
    disabled && 'disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * 현재 텍스트 길이 계산
   */
  const currentLength = useMemo(() => {
    const editor = internalRef.current?.getEditor();
    if (!editor) return 0;
    return Math.max(0, editor.getText().length - 1); // Quill은 마지막에 \n을 추가하므로 -1
  }, [value]);

  return (
    <div className="rich-text-editor-wrapper">
      <div className={containerClassName}>
        <ReactQuill
          ref={internalRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly || disabled}
        />
      </div>

      {/* 글자 수 표시 (편집 모드에서만) */}
      {!readOnly && !disabled && Boolean(maxLength) && (
        <div
          className={`text-sm mt-2 text-right ${
            currentLength > maxLength * 0.9 ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          {t('common:counter.chars', {
            current: currentLength.toLocaleString(i18n.language),
            max: maxLength.toLocaleString(i18n.language),
            defaultValue: `${currentLength.toLocaleString()} / ${maxLength.toLocaleString()}`,
          })}
        </div>
      )}

      {/* 에러 메시지 (옵션) */}
      {error && (
        <div className="text-sm mt-2 text-red-500">
          내용을 입력해주세요.
        </div>
      )}
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
