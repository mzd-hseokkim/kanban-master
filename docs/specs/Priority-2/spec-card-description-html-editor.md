# spec-card-description-html-editor — 카드 설명 HTML Editor

## 1. 개요

카드의 설명(description) 필드에 리치 텍스트 편집 기능을 제공하여 사용자가 더 풍부한 정보를 시각적으로 표현할 수 있도록 한다.

- 기본 텍스트 서식(굵기, 기울임, 밑줄, 취소선), 목록, 링크, 코드 블록을 지원한다.
- XSS 공격을 방지하기 위해 서버/클라이언트 양측에서 HTML sanitization을 수행한다.
- 편집 모드와 읽기 전용 뷰 모드를 구분하여 직관적인 UX를 제공한다.

## 2. 연계 요구사항

- FR-05a HTML Editor 통합
- FR-05b 기본 서식 지원
- FR-05c 목록 및 링크
- FR-05d 코드 블록
- FR-05e 실시간 미리보기
- FR-05f HTML 저장 및 조회
- FR-05g XSS 방지
- FR-05h 편집/뷰 모드 전환
- NFR-05a 성능 (Editor 초기화 < 500ms, 타이핑 지연 < 50ms)
- NFR-05b 보안 (XSS 방지, HTML sanitization)
- NFR-05c 데이터 제한 (최대 50,000자)

## 3. 주요 사용자 시나리오

### 시나리오 1: 카드 생성 시 리치 텍스트 입력
1. 사용자가 "카드 추가" 버튼을 클릭한다.
2. CreateCardModal이 열리고 HTML Editor가 표시된다.
3. 제목을 입력한 후 설명 영역에 포커스를 이동한다.
4. 툴바에서 "굵기" 버튼을 클릭하고 텍스트를 입력한다.
5. 순서 있는 목록 버튼을 클릭하여 체크리스트를 작성한다.
6. 링크 버튼을 클릭하여 URL을 삽입한다.
7. "저장" 버튼을 클릭하면 HTML이 백엔드로 전송된다.
8. 성공 시 카드가 생성되고 모달이 닫힌다.

### 시나리오 2: 카드 수정 시 HTML 편집
1. 사용자가 기존 카드를 클릭하여 EditCardModal을 연다.
2. 카드의 설명이 HTML Editor에 렌더링된 상태로 표시된다.
3. 편집 권한이 있으면 에디터가 활성화되고, 없으면 읽기 전용 모드로 표시된다.
4. 사용자가 기존 텍스트를 선택하고 "기울임" 서식을 적용한다.
5. 코드 블록을 삽입하여 기술적인 내용을 추가한다.
6. "저장" 버튼을 클릭하면 HTML이 업데이트된다.
7. 성공 시 카드 상세 정보가 즉시 업데이트된다.

### 시나리오 3: 카드 목록에서 설명 미리보기
1. 사용자가 보드 페이지에서 카드 목록을 확인한다.
2. 각 카드에 설명이 있는 경우 HTML에서 텍스트만 추출하여 2줄로 표시된다.
3. HTML 태그는 제거되고 순수 텍스트만 표시된다.
4. 긴 설명은 "..." 으로 말줄임 처리된다.

### 시나리오 4: 읽기 전용 모드 표시
1. 사용자가 편집 권한이 없는 카드를 클릭한다.
2. EditCardModal이 읽기 전용 모드로 열린다.
3. HTML Editor 툴바가 표시되지 않는다.
4. 설명 영역이 렌더링된 HTML로 깔끔하게 표시된다.
5. 클릭해도 편집할 수 없다.

### 시나리오 5: XSS 공격 시도
1. 악의적인 사용자가 `<script>alert('XSS')</script>`를 포함한 설명을 입력한다.
2. 프론트엔드에서 DOMPurify가 렌더링 시 스크립트를 제거한다.
3. 백엔드로 전송 시 OWASP HTML Sanitizer가 스크립트를 제거한다.
4. DB에 저장되는 것은 안전한 HTML만 저장된다.
5. 다른 사용자가 해당 카드를 열어도 스크립트가 실행되지 않는다.

## 4. 디자인 가이드라인

### HTML Editor 툴바 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│ [B] [I] [U] [S] | [•] [1.] | [🔗] [</>] [<code>]        │
│  굵기 기울임 밑줄 취소선  목록  링크  코드블록 인라인코드  │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│                                                            │
│  편집 영역                                                 │
│                                                            │
│  사용자가 여기에 리치 텍스트를 입력합니다.                 │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Pastel 디자인 테마 적용

**툴바 스타일:**
- 배경: `bg-pastel-blue-50`
- 버튼: `hover:bg-pastel-blue-100`, `active:bg-pastel-blue-200`
- 구분선: `border-pastel-blue-200`

**편집 영역 스타일:**
- 배경: `bg-white`
- 테두리: `border border-pastel-blue-200`
- 포커스: `focus:ring-2 focus:ring-pastel-blue-300`
- 최소 높이: `min-h-[200px]`

**읽기 전용 모드:**
- 배경: `bg-pastel-blue-50/30`
- 테두리: `border border-pastel-blue-100`
- 커서: `cursor-not-allowed` (편집 불가 시)

### 편집/읽기 모드 전환 UI

**편집 모드:**
```
┌──────────────────────────────────────────────────────────┐
│ 설명                                           [편집 중]  │
├──────────────────────────────────────────────────────────┤
│ [B] [I] [U] [S] | [•] [1.] | [🔗] [</>]                 │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  편집 가능한 텍스트 영역                                   │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**읽기 전용 모드:**
```
┌──────────────────────────────────────────────────────────┐
│ 설명                                        [읽기 전용]   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  렌더링된 HTML 콘텐츠                                      │
│  - 목록 항목 1                                             │
│  - 목록 항목 2                                             │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### 에러 메시지 스타일

**길이 초과:**
```
┌─────────────────────────────────────┐
│ ⚠️ 설명은 50,000자를 초과할 수    │
│    없습니다 (현재: 52,341자)        │ ← 토스트 (3초 후 사라짐)
└─────────────────────────────────────┘
```

**에러 메시지:**
- 길이 초과: "설명은 50,000자를 초과할 수 없습니다 (현재: {count}자)"
- 저장 실패: "카드 저장에 실패했습니다. 다시 시도해주세요"
- 네트워크 오류: "네트워크 연결을 확인해주세요"

**토스트 스타일:**
- 배경: `pastel-pink-500` (에러), `pastel-green-500` (성공)
- 텍스트: 흰색
- 위치: 화면 우측 상단
- 자동 사라짐: 3초 후

## 5. 프론트엔드 규격

### 페이지/컴포넌트 구조

#### 1. RichTextEditor.tsx (신규 생성)

**역할:** Quill Editor를 감싸는 재사용 가능한 wrapper 컴포넌트

**Props:**
```typescript
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}
```

**상태:**
```typescript
const [editorHtml, setEditorHtml] = useState<string>(value);
const [charCount, setCharCount] = useState<number>(0);
const quillRef = useRef<ReactQuill>(null);
```

**Quill 모듈 설정:**
```typescript
const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],        // 텍스트 서식
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],     // 목록
    ['link', 'blockquote', 'code-block'],             // 링크, 인용, 코드
    ['clean']                                          // 서식 제거
  ],
};

const formats = [
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'blockquote', 'code-block'
];
```

**핵심 로직:**
```typescript
const handleChange = (content: string, delta: any, source: string, editor: any) => {
  const text = editor.getText();
  const length = text.length;

  // 최대 길이 체크
  if (maxLength && length > maxLength) {
    showToast(`설명은 ${maxLength}자를 초과할 수 없습니다 (현재: ${length}자)`, 'error');
    return;
  }

  setEditorHtml(content);
  setCharCount(length);
  onChange(content);
};
```

**렌더링:**
```typescript
return (
  <div className={className}>
    <ReactQuill
      ref={quillRef}
      theme="snow"
      value={editorHtml}
      onChange={handleChange}
      modules={modules}
      formats={formats}
      readOnly={readOnly || disabled}
      placeholder={placeholder}
      className={`
        ${readOnly ? 'quill-readonly' : ''}
        ${disabled ? 'quill-disabled' : ''}
      `}
    />
    {maxLength && (
      <div className="text-xs text-pastel-blue-500 mt-1 text-right">
        {charCount} / {maxLength}
      </div>
    )}
  </div>
);
```

#### 2. HtmlContent.tsx (신규 생성)

**역할:** HTML을 안전하게 렌더링하는 컴포넌트

**Props:**
```typescript
interface HtmlContentProps {
  html: string;
  className?: string;
  maxLines?: number;  // 미리보기용 줄 수 제한
}
```

**핵심 로직:**
```typescript
import DOMPurify from 'dompurify';

const HtmlContent: React.FC<HtmlContentProps> = ({ html, className, maxLines }) => {
  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'strike', 'ul', 'ol', 'li',
                     'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote',
                     'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }, [html]);

  return (
    <div
      className={`prose prose-sm max-w-none ${maxLines ? `line-clamp-${maxLines}` : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
```

#### 3. EditCardModal.tsx (수정)

**변경점:**
- `<textarea>` → `<RichTextEditor>` 컴포넌트로 교체

**Before:**
```typescript
<textarea
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="카드에 대한 설명을 입력하세요 (선택사항)"
  className={modalTextareaClass}
  rows={3}
  disabled={loading || !canEdit}
  readOnly={!canEdit}
/>
```

**After:**
```typescript
<RichTextEditor
  value={description || ''}
  onChange={setDescription}
  placeholder="카드에 대한 설명을 입력하세요 (선택사항)"
  readOnly={!canEdit}
  disabled={loading}
  maxLength={50000}
  className="min-h-[200px]"
/>
```

#### 4. CreateCardModal.tsx (수정)

**변경점:**
- EditCardModal과 동일하게 `<RichTextEditor>` 사용

**After:**
```typescript
<RichTextEditor
  value={description}
  onChange={setDescription}
  placeholder="카드에 대한 설명을 입력하세요 (선택사항)"
  disabled={loading}
  maxLength={50000}
  className="min-h-[200px]"
/>
```

#### 5. CardItem.tsx (수정)

**변경점:**
- plain text 표시 → HTML 렌더링 또는 텍스트 추출

**Option 1: 텍스트만 추출 (권장)**
```typescript
{card.description && (
  <p className="text-xs text-pastel-blue-600 mb-2 line-clamp-2">
    {stripHtmlTags(card.description)}
  </p>
)}

// Utility 함수
const stripHtmlTags = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};
```

**Option 2: HTML 렌더링**
```typescript
{card.description && (
  <HtmlContent
    html={card.description}
    maxLines={2}
    className="text-xs text-pastel-blue-600 mb-2"
  />
)}
```

### 패키지 설치

**package.json에 추가:**
```json
{
  "dependencies": {
    "quill": "^2.0.2",
    "react-quill": "^2.0.0",
    "dompurify": "^3.0.6"
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.5",
    "@types/react-quill": "^2.0.4"
  }
}
```

**설치 명령:**
```bash
npm install quill react-quill dompurify
npm install --save-dev @types/dompurify @types/react-quill
```

### Quill 커스텀 스타일

**frontend/src/styles/quill-custom.css (신규 생성):**
```css
/* Quill Editor Pastel Theme */
.ql-toolbar {
  background-color: rgb(239 246 255); /* pastel-blue-50 */
  border: 1px solid rgb(191 219 254); /* pastel-blue-200 */
  border-radius: 0.375rem 0.375rem 0 0;
}

.ql-container {
  border: 1px solid rgb(191 219 254);
  border-top: none;
  border-radius: 0 0 0.375rem 0.375rem;
  font-family: inherit;
  font-size: 0.875rem;
  min-height: 200px;
}

.ql-editor {
  padding: 1rem;
  min-height: 200px;
}

.ql-editor.ql-blank::before {
  color: rgb(147 197 253); /* pastel-blue-300 */
  font-style: normal;
}

/* 툴바 버튼 */
.ql-toolbar button:hover {
  background-color: rgb(219 234 254); /* pastel-blue-100 */
  border-radius: 0.25rem;
}

.ql-toolbar button.ql-active {
  background-color: rgb(191 219 254); /* pastel-blue-200 */
  border-radius: 0.25rem;
}

/* 읽기 전용 모드 */
.quill-readonly .ql-toolbar {
  display: none;
}

.quill-readonly .ql-container {
  border: 1px solid rgb(219 234 254);
  background-color: rgb(239 246 255 / 0.3);
  border-radius: 0.375rem;
}

/* 비활성화 모드 */
.quill-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**main.tsx에 import:**
```typescript
import 'quill/dist/quill.snow.css';
import './styles/quill-custom.css';
```

### 상태 관리

**현재 상태 관리 방식 유지:**
- EditCardModal, CreateCardModal에서 로컬 state로 description 관리
- 변경사항 없음 (HTML string을 그대로 사용)

### 에러 처리

**클라이언트 검증:**
```typescript
const handleSave = async () => {
  // 길이 검증
  const textLength = quillRef.current?.getEditor().getText().length || 0;
  if (textLength > 50000) {
    showToast('설명은 50,000자를 초과할 수 없습니다', 'error');
    return;
  }

  try {
    await cardService.updateCard(workspaceId, boardId, columnId, cardId, {
      ...cardData,
      description,
    });
    showToast('카드가 수정되었습니다', 'success');
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '카드 저장에 실패했습니다';
    showToast(errorMessage, 'error');
  }
};
```

## 6. 백엔드 규격

### 의존성 추가

**build.gradle.kts:**
```kotlin
dependencies {
    // 기존 의존성...

    // HTML Sanitization
    implementation("com.googlecode.owasp-java-html-sanitizer:owasp-java-html-sanitizer:20220608.1")
}
```

### HTML Sanitization 설정

**HtmlSanitizerConfig.java (신규 생성):**
```java
package com.kanban.config;

import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HtmlSanitizerConfig {

    @Bean
    public PolicyFactory htmlSanitizerPolicy() {
        return Sanitizers.FORMATTING
                .and(Sanitizers.BLOCKS)
                .and(Sanitizers.LINKS)
                .and(Sanitizers.STYLES);
    }
}
```

### DTO Validation 추가

**CreateCardRequest.java:**
```java
@Size(max = 50000, message = "설명은 50,000자를 초과할 수 없습니다")
private String description;
```

**UpdateCardRequest.java:**
```java
@Size(max = 50000, message = "설명은 50,000자를 초과할 수 없습니다")
private String description;
```

### CardService HTML Sanitization

**CardService.java 수정:**
```java
@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final PolicyFactory htmlSanitizerPolicy;

    /**
     * 카드 생성
     */
    public Card createCard(Long workspaceId, Long boardId, Long columnId, CreateCardRequest request, User currentUser) {
        // ... 기존 로직

        Card card = Card.builder()
                .title(request.getTitle())
                .description(sanitizeHtml(request.getDescription()))
                .column(column)
                .assignee(assignee)
                .priority(request.getPriority())
                .dueDate(request.getDueDate())
                .position(position)
                .build();

        return cardRepository.save(card);
    }

    /**
     * 카드 수정
     */
    public Card updateCard(Long workspaceId, Long boardId, Long columnId, Long cardId, UpdateCardRequest request, User currentUser) {
        // ... 기존 로직

        if (request.getDescription() != null) {
            card.setDescription(sanitizeHtml(request.getDescription()));
        }

        // ... 나머지 로직

        return cardRepository.save(card);
    }

    /**
     * HTML Sanitization
     */
    private String sanitizeHtml(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }
        return htmlSanitizerPolicy.sanitize(html);
    }
}
```

### 허용 HTML 태그 정책

**PolicyFactory 커스터마이징 (선택사항):**
```java
@Bean
public PolicyFactory htmlSanitizerPolicy() {
    return new HtmlPolicyBuilder()
            // 기본 텍스트 서식
            .allowElements("p", "br", "strong", "em", "u", "strike")
            // 제목
            .allowElements("h1", "h2", "h3", "h4", "h5", "h6")
            // 목록
            .allowElements("ul", "ol", "li")
            // 링크
            .allowElements("a")
            .allowAttributes("href", "target", "rel").onElements("a")
            .requireRelNofollowOnLinks()
            // 인용
            .allowElements("blockquote")
            // 코드
            .allowElements("code", "pre")
            .toFactory();
}
```

**허용 태그 목록:**
- **텍스트 서식**: `<p>`, `<br>`, `<strong>`, `<em>`, `<u>`, `<strike>`
- **제목**: `<h1>` ~ `<h6>`
- **목록**: `<ul>`, `<ol>`, `<li>`
- **링크**: `<a href="..." target="..." rel="...">`
- **인용**: `<blockquote>`
- **코드**: `<code>`, `<pre>`

**금지 태그:**
- `<script>`, `<iframe>`, `<embed>`, `<object>`, `<style>`, `<img>` (현재 단계)

### API 엔드포인트

**기존 엔드포인트 그대로 사용:**

```
POST /api/v1/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards
PUT /api/v1/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}
```

**요청 본문:**
```json
{
  "title": "카드 제목",
  "description": "<p><strong>굵은 텍스트</strong></p><ul><li>항목 1</li><li>항목 2</li></ul>",
  "assigneeId": 1,
  "priority": "HIGH",
  "dueDate": "2024-12-31T23:59:59"
}
```

**응답:**
```json
{
  "id": 123,
  "title": "카드 제목",
  "description": "<p><strong>굵은 텍스트</strong></p><ul><li>항목 1</li><li>항목 2</li></ul>",
  "assignee": { ... },
  "priority": "HIGH",
  "dueDate": "2024-12-31T23:59:59",
  "createdAt": "2024-11-13T10:00:00",
  "updatedAt": "2024-11-13T10:00:00"
}
```

## 7. 보안 처리

### XSS 방지 전략

#### 다층 방어 (Defense in Depth)

1. **프론트엔드 (렌더링 시)**
   - DOMPurify로 HTML sanitization
   - 허용된 태그와 속성만 렌더링
   - React의 기본 XSS 방어 메커니즘 활용

2. **백엔드 (저장 시)**
   - OWASP Java HTML Sanitizer로 HTML 정제
   - 위험한 태그/속성 제거
   - DB에 안전한 HTML만 저장

3. **데이터베이스**
   - SQL Injection 방지 (JPA 사용으로 자동 방어)
   - Prepared Statement 사용

### HTML Sanitization 정책

**클라이언트 (DOMPurify):**
```typescript
const sanitizedHtml = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
});
```

**서버 (OWASP HTML Sanitizer):**
```java
PolicyFactory policy = new HtmlPolicyBuilder()
    .allowElements("p", "br", "strong", "em", "u", "strike")
    .allowElements("h1", "h2", "h3", "h4", "h5", "h6")
    .allowElements("ul", "ol", "li")
    .allowElements("a")
    .allowAttributes("href", "target", "rel").onElements("a")
    .requireRelNofollowOnLinks()
    .allowElements("blockquote", "code", "pre")
    .toFactory();
```

### 보안 테스트 케이스

**테스트해야 할 XSS 공격 벡터:**

1. `<script>alert('XSS')</script>` → 제거됨
2. `<img src=x onerror=alert('XSS')>` → 제거됨
3. `<a href="javascript:alert('XSS')">링크</a>` → href 제거됨
4. `<iframe src="evil.com"></iframe>` → 제거됨
5. `<style>body{display:none}</style>` → 제거됨
6. `<p onclick="alert('XSS')">텍스트</p>` → onclick 제거됨

**허용되어야 할 정상 HTML:**

1. `<p><strong>굵은 텍스트</strong></p>` → 허용
2. `<ul><li>항목 1</li></ul>` → 허용
3. `<a href="https://example.com" target="_blank" rel="noopener noreferrer">링크</a>` → 허용
4. `<code>const x = 1;</code>` → 허용
5. `<blockquote>인용문</blockquote>` → 허용

## 8. 수용 기준

1. 사용자가 카드 생성/수정 시 HTML Editor를 사용하여 리치 텍스트를 입력할 수 있다.
2. 툴바에서 굵기, 기울임, 밑줄, 취소선, 목록, 링크, 코드 블록을 지원한다.
3. Editor 초기화 시간이 500ms 이내, 타이핑 지연이 50ms 이내이다.
4. 편집 권한이 없는 경우 읽기 전용 모드로 표시되고 툴바가 숨겨진다.
5. 카드 목록에서 설명이 텍스트로 추출되어 2줄로 미리보기된다.
6. HTML 콘텐츠가 50,000자를 초과하면 저장이 거부되고 에러 메시지가 표시된다.
7. `<script>`, `<iframe>` 등 위험한 태그가 포함된 HTML은 서버/클라이언트에서 제거된다.
8. 기존 plain text description은 HTML로 자동 변환되어 표시된다.
9. 모든 모던 브라우저(Chrome, Firefox, Safari, Edge)에서 정상 작동한다.
10. 키보드 단축키(Ctrl+B, Ctrl+I 등)가 정상 작동한다.

## 9. 구현 순서

### Phase 1: 백엔드 보안 강화 (2일)
- [ ] OWASP HTML Sanitizer 의존성 추가 (`build.gradle.kts`)
- [ ] `HtmlSanitizerConfig.java` 생성 (PolicyFactory 설정)
- [ ] `CreateCardRequest.java` validation 추가 (`@Size(max = 50000)`)
- [ ] `UpdateCardRequest.java` validation 추가 (`@Size(max = 50000)`)
- [ ] `CardService.java` sanitization 로직 추가 (`sanitizeHtml()`)
- [ ] Unit Tests (HTML sanitization 로직 테스트)
- [ ] Integration Tests (API 레벨 테스트)

### Phase 2: 프론트엔드 라이브러리 설치 및 컴포넌트 생성 (2일)
- [ ] 패키지 설치 (`quill`, `react-quill`, `dompurify`)
- [ ] `quill-custom.css` 생성 (Pastel 테마)
- [ ] `RichTextEditor.tsx` 컴포넌트 생성
- [ ] `HtmlContent.tsx` 컴포넌트 생성
- [ ] Unit Tests (컴포넌트 테스트)

### Phase 3: 모달 통합 및 UI 개선 (2일)
- [ ] `EditCardModal.tsx` 수정 (RichTextEditor 통합)
- [ ] `CreateCardModal.tsx` 수정 (RichTextEditor 통합)
- [ ] `CardItem.tsx` 수정 (HTML 안전 렌더링)
- [ ] 읽기 전용 모드 스타일링
- [ ] 에러 메시지 및 토스트 알림 추가
- [ ] 반응형 디자인 적용

### Phase 4: 테스트 및 검증 (1.5일)
- [ ] E2E 테스트 (Playwright)
- [ ] 브라우저 호환성 테스트 (Chrome, Firefox, Safari, Edge)
- [ ] 접근성 테스트 (키보드 네비게이션, 스크린 리더)
- [ ] 성능 테스트 (초기화 시간, 타이핑 지연)
- [ ] 보안 테스트 (XSS 공격 시나리오)
- [ ] 버그 수정 및 최종 검증

**총 소요 시간: ~7.5일**

## 10. 위험 요소 및 완화 전략

| 위험 | 영향 | 완화 전략 |
|------|------|----------|
| XSS 공격 | 보안 취약점 | 서버/클라이언트 양측 HTML sanitization, 허용 태그 화이트리스트 |
| 대용량 HTML 콘텐츠 | 성능 저하 | 50,000자 제한, 클라이언트/서버 검증 |
| 에디터 번들 크기 증가 | 초기 로딩 지연 | Lazy loading, Code splitting, Quill 경량 라이브러리 선택 |
| 브라우저 호환성 | 일부 사용자 UX 저하 | Quill은 modern browser 지원, polyfill 필요 시 추가 |
| 기존 plain text 데이터 | 마이그레이션 이슈 | 자동 HTML 변환 로직 (plain text → `<p>` 태그) |
| 모바일 경험 | 편집 어려움 | 터치 최적화, 간소화된 툴바, 반응형 디자인 |

## 11. 테스트 전략

### Unit Tests

**백엔드:**
- `HtmlSanitizerConfig`: PolicyFactory 설정 테스트
- `CardService.sanitizeHtml()`:
  - XSS 공격 벡터 제거 확인
  - 정상 HTML 허용 확인
  - null/빈 문자열 처리
- `CreateCardRequest`: validation 테스트 (50,000자 제한)

**프론트엔드:**
- `RichTextEditor`:
  - props 전달 테스트
  - onChange 콜백 테스트
  - readOnly 모드 테스트
  - maxLength 제한 테스트
- `HtmlContent`:
  - DOMPurify sanitization 테스트
  - XSS 벡터 제거 확인

### Integration Tests

**백엔드:**
```
1. POST /api/v1/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards
   - 정상 HTML → 200 OK + sanitized HTML 반환
   - XSS 포함 HTML → 200 OK + 위험 태그 제거된 HTML 반환
   - 50,000자 초과 → 400 Bad Request
   - 인증 실패 → 401 Unauthorized

2. PUT /api/v1/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}
   - 정상 HTML 업데이트 → 200 OK
   - XSS 포함 HTML → 200 OK + sanitized
   - 길이 초과 → 400 Bad Request
```

**프론트엔드:**
```
1. 카드 생성 플로우
   - RichTextEditor에 텍스트 입력 → API 호출 → 카드 생성 확인
2. 카드 수정 플로우
   - 기존 카드 열기 → HTML 렌더링 → 수정 → 저장 → UI 업데이트
3. 읽기 전용 모드
   - 권한 없는 사용자 → 툴바 숨김 → 편집 불가 확인
```

### E2E Tests (Playwright)

```
시나리오 1: 리치 텍스트 입력 및 저장
  1. 로그인
  2. 보드 페이지로 이동
  3. "카드 추가" 클릭
  4. 제목 입력: "테스트 카드"
  5. 설명에서 "굵기" 버튼 클릭 → "중요한 내용" 입력
  6. 목록 버튼 클릭 → "항목 1", "항목 2" 입력
  7. "저장" 클릭
  8. 카드가 생성되고 모달 닫힘 확인
  9. 생성된 카드 클릭 → HTML이 올바르게 렌더링되는지 확인

시나리오 2: XSS 공격 시도
  1. 카드 생성 모달 열기
  2. 설명에 `<script>alert('XSS')</script>` 입력
  3. 저장 클릭
  4. 카드 상세 보기 → 스크립트가 실행되지 않음 확인
  5. description에 `<script>` 태그가 없음 확인

시나리오 3: 길이 제한
  1. 카드 생성 모달 열기
  2. 50,000자 이상의 텍스트 입력 시도
  3. 에러 토스트 표시 확인
  4. 저장 버튼 클릭 시 실패 확인

시나리오 4: 읽기 전용 모드
  1. 편집 권한이 없는 사용자로 로그인
  2. 카드 클릭
  3. 툴바가 표시되지 않음 확인
  4. 설명 영역 클릭 시 편집 불가 확인
```

### 성능 테스트

- **에디터 초기화**: 500ms 이내
- **타이핑 지연**: 50ms 이내 (사용자가 느끼지 못할 정도)
- **HTML 렌더링**: 100ms 이내
- **번들 크기 증가**: Quill (~50KB gzipped) + DOMPurify (~10KB)

### 접근성 테스트

- 키보드로 에디터 포커스 이동 가능
- Ctrl+B, Ctrl+I 등 단축키 작동
- 스크린 리더로 에디터 사용 가능
- ARIA 레이블 확인

## 12. Notes

- **기존 데이터 마이그레이션**: plain text description은 자동으로 `<p>` 태그로 감싸서 렌더링
  ```typescript
  const convertPlainTextToHtml = (text: string): string => {
    if (!text) return '';
    // HTML 태그가 없으면 plain text로 간주
    if (!/<[a-z][\s\S]*>/i.test(text)) {
      return `<p>${text.replace(/\n/g, '<br>')}</p>`;
    }
    return text;
  };
  ```

- **이미지 업로드**: Priority-3에서 별도로 구현
  - 현재는 텍스트, 목록, 링크, 코드만 지원
  - 향후 이미지 업로드 엔드포인트 추가 후 에디터에 통합

- **모바일 최적화**:
  - Quill은 터치 이벤트를 지원하지만, 툴바가 작을 수 있음
  - 모바일에서는 간소화된 툴바 제공 고려

- **테이블 지원**:
  - 현재 단계에서는 제외
  - 필요 시 Priority-3에서 추가

- **마크다운 지원**:
  - 현재는 HTML만 지원
  - 향후 마크다운 ↔ HTML 변환 기능 고려

- **버전 관리**:
  - description 변경 이력은 현재 단계에서 제외
  - Activity Log에 "카드 설명 변경" 이벤트만 기록

## 13. Related Documents

- `../../requirements/Priority-2/card-description-html-editor.md` - 요구사항 정의
- `../Priority-1/model-cards-001.md` - Card 엔티티 정의
- `../Priority-1/api-spec.md` - API 명세 참조
- `../Priority-1/frontend-design.md` - 프론트엔드 디자인 시스템
- `CLAUDE.md` - 프로젝트 전체 가이드라인
