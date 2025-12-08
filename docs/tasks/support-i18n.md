# 다국어 지원(i18n) 구현 계획서

## 📋 개요

본 문서는 Kanban 프로젝트에 다국어 지원(Internationalization, i18n)을 추가하기 위한 설계 및 구현 계획을 담고 있습니다.

**목표**: 영어(en)와 한국어(ko) 두 가지 언어를 기본 지원하는 다국어 시스템 구축

**작성일**: 2025-11-28
**상태**: 계획 수립 완료

---

## 🔍 현황 분석

### 프로젝트 구조

- **백엔드**: Spring Boot 3.2, Java 17
- **프론트엔드**: React 19, TypeScript 5.3, Vite 5

### 하드코딩 문제점

- **백엔드**: 약 100개 이상의 Java 파일에 하드코딩된 문자열 존재
  - 예외 메시지, 검증 메시지, 이메일 템플릿, 로그 메시지 등
  - 예시: `"Board not found"`, `"Invalid email format"` 등

- **프론트엔드**: 약 100개 이상의 컴포넌트에 하드코딩된 한글/영문 혼재
  - UI 레이블, 버튼 텍스트, 알림 메시지, 검증 메시지 등
  - 예시: `"지금 확인하기"`, `"확인"`, `"취소"` 등

---

## 🎯 기본 설계 방향

### 1. 백엔드 i18n 설계

#### ✅ Spring MessageSource 기반 접근

**아키텍처**:

```
backend/src/main/resources/
├── messages.properties          (기본, fallback용 영어)
├── messages_en.properties       (영어)
└── messages_ko.properties       (한국어)
```

**주요 구성 요소**:

1. **MessageSource 설정** (`I18nConfig.java`)
   - `ResourceBundleMessageSource` 사용
   - UTF-8 인코딩 설정
   - 캐싱 전략 (개발: 0초, 운영: 3600초)
   - Fallback locale: 영어

2. **LocaleResolver 설정**
   - `AcceptHeaderLocaleResolver` 사용 (HTTP `Accept-Language` 헤더 기반)
   - 기본 locale: 영어 (`en`)
   - 지원 locale: `en`, `ko`

3. **메시지 키 네이밍 컨벤션**:

   ```
   error.{domain}.{situation}
   validation.{field}.{rule}
   email.{template}.{section}
   success.{action}
   label.{entity}.{field}
   ```

   **예시**:

   ```properties
   # messages_en.properties
   error.board.not-found=Board not found with ID: {0}
   validation.email.invalid=Invalid email format
   email.invitation.subject=Board Invitation
   success.board.created=Board created successfully

   # messages_ko.properties
   error.board.not-found=보드를 찾을 수 없습니다. ID: {0}
   validation.email.invalid=이메일 형식이 올바르지 않습니다
   email.invitation.subject=보드 초대
   success.board.created=보드가 성공적으로 생성되었습니다
   ```

4. **MessageSourceService 유틸리티**:

   ```java
   @Service
   public class MessageSourceService {
       String getMessage(String code, Object... args);
       String getMessageOrDefault(String code, String defaultMsg, Object... args);
   }
   ```

5. **적용 범위**:
   - ✅ 예외 메시지 (ResourceNotFoundException 등)
   - ✅ Bean Validation 메시지 (`@NotBlank(message = "{validation.field.required}")`)
   - ✅ 이메일 템플릿 (EmailUtil, EmailTemplateUtil)
   - ✅ 성공/실패 응답 메시지
   - ❌ 로그 메시지 (영어 고정, 운영/디버깅 용도)
   - ❌ 내부 시스템 메시지

---

### 2. 프론트엔드 i18n 설계

#### ✅ i18next + react-i18next 기반 접근

**아키텍처**:

```
frontend/src/
├── i18n/
│   ├── index.ts              (i18next 설정)
│   └── locales/
│       ├── en/
│       │   ├── common.json
│       │   ├── auth.json
│       │   ├── board.json
│       │   ├── card.json
│       │   └── notification.json
│       └── ko/
│           ├── common.json
│           ├── auth.json
│           ├── board.json
│           ├── card.json
│           └── notification.json
```

**주요 구성 요소**:

1. **i18next 설정** (`i18n/index.ts`):

   ```typescript
   import i18n from 'i18next';
   import { initReactI18next } from 'react-i18next';
   import LanguageDetector from 'i18next-browser-languagedetector';

   i18n
     .use(LanguageDetector) // 브라우저 언어 자동 감지
     .use(initReactI18next)
     .init({
       fallbackLng: 'en',
       supportedLngs: ['en', 'ko'],
       debug: false,
       interpolation: { escapeValue: false },
       detection: {
         order: ['localStorage', 'navigator'],
         caches: ['localStorage']
       }
     });
   ```

2. **번역 파일 구조** (도메인별 분리):

   ```json
   // locales/ko/common.json
   {
     "button": {
       "confirm": "확인",
       "cancel": "취소",
       "delete": "삭제",
       "save": "저장"
     },
     "label": {
       "search": "검색",
       "filter": "필터"
     }
   }

   // locales/ko/board.json
   {
     "title": "보드",
     "create": "보드 만들기",
     "notFound": "보드를 찾을 수 없습니다",
     "deleteConfirm": "이 보드를 삭제하시겠습니까?"
   }
   ```

3. **useTranslation Hook 사용**:

   ```typescript
   import { useTranslation } from 'react-i18next';

   const { t, i18n } = useTranslation(['common', 'board']);

   // 사용 예시
   <button>{t('common:button.confirm')}</button>
   <h1>{t('board:create')}</h1>

   // 언어 변경
   i18n.changeLanguage('ko');
   ```

4. **언어 전환 컴포넌트** (`LanguageSwitcher.tsx`):
   - 전역 네비게이션 바에 언어 선택 드롭다운 추가
   - localStorage에 선택한 언어 저장
   - 백엔드 API 호출 시 `Accept-Language` 헤더 자동 설정

5. **적용 범위**:
   - ✅ UI 레이블, 버튼 텍스트
   - ✅ 폼 검증 메시지
   - ✅ 알림/토스트 메시지
   - ✅ 모달 제목/내용
   - ✅ 네비게이션 메뉴
   - ❌ 개발자 콘솔 로그
   - ❌ API 엔드포인트 URL

---

## 🛠️ 기술 스택 및 라이브러리

### 백엔드

- ✅ **Spring MessageSource** (Spring Framework 내장)
- ✅ **ResourceBundleMessageSource** (properties 파일 기반)
- ✅ **AcceptHeaderLocaleResolver** (HTTP 헤더 기반 locale 감지)

### 프론트엔드

- ✅ **i18next** (v23+) - 핵심 i18n 라이브러리
- ✅ **react-i18next** (v14+) - React 통합
- ✅ **i18next-browser-languagedetector** - 브라우저 언어 자동 감지
- ✅ **i18next-http-backend** (선택) - 동적 번역 파일 로딩

---

## 📦 단계별 마이그레이션 로드맵

### Phase 0: 인프라 구축 (우선순위: ⭐⭐⭐⭐⭐)

**예상 소요 시간**: 1-2일

#### 백엔드 작업

1. [x] `backend/src/main/java/com/kanban/config/I18nConfig.java` 생성
   - MessageSource 설정
   - LocaleResolver 설정

2. [x] `backend/src/main/java/com/kanban/util/MessageSourceService.java` 생성
   - `getMessage(String code, Object... args)` 메서드
   - `getMessageOrDefault(String code, String defaultMsg, Object... args)` 메서드

3. [x] 리소스 파일 생성:
   - `backend/src/main/resources/messages.properties` (테스트 메시지 포함)
   - `backend/src/main/resources/messages_en.properties` (테스트 메시지 포함)
   - `backend/src/main/resources/messages_ko.properties` (테스트 메시지 포함)

4. [x] 테스트 작성:
   - `backend/src/test/java/com/kanban/config/I18nConfigTest.java` (8/8 테스트 통과)

#### 프론트엔드 작업

1. ✅ 라이브러리 설치:

   ```bash
   npm install i18next react-i18next i18next-browser-languagedetector
   ```

2. ✅ `frontend/src/i18n/index.ts` 생성 (i18next 설정)

3. ✅ 번역 파일 생성 (빈 파일):

   ```
   frontend/src/i18n/locales/
   ├── en/
   │   ├── common.json
   │   ├── auth.json
   │   ├── board.json
   │   ├── card.json
   │   └── notification.json
   └── ko/
       ├── common.json
       ├── auth.json
       ├── board.json
       ├── card.json
       └── notification.json
   ```

4. ✅ `frontend/src/main.tsx` 수정:
   - i18n 초기화 import 추가

5. ✅ `frontend/src/components/LanguageSwitcher.tsx` 생성:
   - 언어 전환 드롭다운 컴포넌트

6. ✅ `frontend/src/utils/axios.ts` 수정:
   - Axios 인터셉터에 `Accept-Language` 헤더 추가

#### 검증 기준

- [ ] 백엔드: `MessageSourceService.getMessage("test.key")` 동작 확인
- [ ] 프론트엔드: `useTranslation()` hook으로 번역 출력 확인
- [ ] E2E: 언어 전환 시 UI 텍스트 변경 확인

---

### Phase 1: 핵심 도메인 다국어화 (우선순위: ⭐⭐⭐⭐)

**예상 소요 시간**: 3-5일

#### 백엔드 작업 (우선순위 순)

1. **예외 메시지 다국어화**
   - 대상: `ResourceNotFoundException`, `CardHasChildrenException` 등
   - 작업:

     ```java
     // 변경 전
     throw new ResourceNotFoundException("Board not found with ID: " + boardId);

     // 변경 후
     throw new ResourceNotFoundException(
         messageSourceService.getMessage("error.board.not-found", boardId)
     );
     ```

   - 번역 키 추가:

     ```properties
     # messages_en.properties
     error.board.not-found=Board not found with ID: {0}
     error.card.not-found=Card not found with ID: {0}
     error.card.has-children=Cannot delete card with child cards

     # messages_ko.properties
     error.board.not-found=보드를 찾을 수 없습니다. ID: {0}
     error.card.not-found=카드를 찾을 수 없습니다. ID: {0}
     error.card.has-children=하위 카드가 있는 카드는 삭제할 수 없습니다
     ```

2. **Bean Validation 메시지 다국어화**
   - 대상: `@NotBlank`, `@Email`, `@Size` 등의 validation 어노테이션
   - 작업:

     ```java
     // 변경 전
     @NotBlank
     private String email;

     // 변경 후
     @NotBlank(message = "{validation.email.required}")
     @Email(message = "{validation.email.invalid}")
     private String email;
     ```

   - 번역 키 추가:

     ```properties
     # messages_en.properties
     validation.email.required=Email is required
     validation.email.invalid=Invalid email format
     validation.password.required=Password is required
     validation.password.min-length=Password must be at least {min} characters

     # messages_ko.properties
     validation.email.required=이메일은 필수입니다
     validation.email.invalid=이메일 형식이 올바르지 않습니다
     validation.password.required=비밀번호는 필수입니다
     validation.password.min-length=비밀번호는 최소 {min}자 이상이어야 합니다
     ```

3. **이메일 템플릿 다국어화**
   - 대상: `EmailUtil`, `EmailTemplateUtil`
   - 작업: 하드코딩된 제목, 본문, CTA 버튼 텍스트를 메시지 키로 교체
   - 번역 키 추가:

     ```properties
     # messages_en.properties
     email.invitation.subject=You're invited to join a board
     email.invitation.greeting=Hi {0},
     email.invitation.body={1} has invited you to collaborate on the board "{2}"
     email.invitation.cta=Accept Invitation

     # messages_ko.properties
     email.invitation.subject=보드 초대 알림
     email.invitation.greeting=안녕하세요 {0}님,
     email.invitation.body={1}님이 "{2}" 보드에 초대했습니다
     email.invitation.cta=초대 수락하기
     ```

#### 프론트엔드 작업 (우선순위 순)

1. **공통 컴포넌트 다국어화** (`common.json`)

   ```json
   // locales/en/common.json
   {
     "button": {
       "confirm": "Confirm",
       "cancel": "Cancel",
       "delete": "Delete",
       "save": "Save",
       "edit": "Edit",
       "close": "Close"
     },
     "label": {
       "search": "Search",
       "filter": "Filter",
       "settings": "Settings"
     },
     "action": {
       "viewNow": "View now",
       "loading": "Loading...",
       "noData": "No data available"
     }
   }

   // locales/ko/common.json
   {
     "button": {
       "confirm": "확인",
       "cancel": "취소",
       "delete": "삭제",
       "save": "저장",
       "edit": "수정",
       "close": "닫기"
     },
     "label": {
       "search": "검색",
       "filter": "필터",
       "settings": "설정"
     },
     "action": {
       "viewNow": "지금 확인하기",
       "loading": "로딩 중...",
       "noData": "데이터가 없습니다"
     }
   }
   ```

2. **인증 관련 다국어화** (`auth.json`)
   - 대상: `LoginPage.tsx`, `SignupPage.tsx`, `VerifyEmailPage.tsx` 등

   ```json
   // locales/en/auth.json
   {
     "login": {
       "title": "Sign in to Kanban",
       "email": "Email address",
       "password": "Password",
       "submit": "Sign in",
       "forgotPassword": "Forgot password?",
       "noAccount": "Don't have an account?",
       "signUp": "Sign up"
     },
     "signup": {
       "title": "Create your account",
       "submit": "Create account",
       "hasAccount": "Already have an account?",
       "signIn": "Sign in"
     }
   }

   // locales/ko/auth.json
   {
     "login": {
       "title": "Kanban 로그인",
       "email": "이메일 주소",
       "password": "비밀번호",
       "submit": "로그인",
       "forgotPassword": "비밀번호를 잊으셨나요?",
       "noAccount": "계정이 없으신가요?",
       "signUp": "회원가입"
     },
     "signup": {
       "title": "계정 만들기",
       "submit": "계정 생성",
       "hasAccount": "이미 계정이 있으신가요?",
       "signIn": "로그인"
     }
   }
   ```

3. **보드/카드 관련 다국어화** (`board.json`, `card.json`)
   - 대상: `CreateBoardModal.tsx`, `CreateCardModal.tsx`, `BoardDetailPage.tsx` 등

   ```json
   // locales/en/board.json
   {
     "title": "Board",
     "create": "Create board",
     "edit": "Edit board",
     "delete": "Delete board",
     "notFound": "Board not found",
     "deleteConfirm": "Are you sure you want to delete this board?",
     "members": "Members",
     "inviteMember": "Invite member"
   }

   // locales/ko/board.json
   {
     "title": "보드",
     "create": "보드 만들기",
     "edit": "보드 수정",
     "delete": "보드 삭제",
     "notFound": "보드를 찾을 수 없습니다",
     "deleteConfirm": "이 보드를 삭제하시겠습니까?",
     "members": "멤버",
     "inviteMember": "멤버 초대"
   }
   ```

4. **알림/토스트 메시지 다국어화** (`notification.json`)
   - 대상: `GlobalNavBar.tsx`, 토스트 메시지 등

   ```json
   // locales/en/notification.json
   {
     "inbox": "Inbox",
     "watchList": "Watch list",
     "noNotifications": "No notifications",
     "markAsRead": "Mark as read",
     "viewAll": "View all"
   }

   // locales/ko/notification.json
   {
     "inbox": "받은편지함",
     "watchList": "관심 목록",
     "noNotifications": "알림이 없습니다",
     "markAsRead": "읽음으로 표시",
     "viewAll": "전체 보기"
   }
   ```

#### 검증 기준

- [ ] 백엔드: Postman/curl로 `Accept-Language: ko` vs `en` 헤더 테스트
- [ ] 프론트엔드: 언어 전환 후 주요 플로우 테스트 (로그인, 보드 생성 등)
- [ ] E2E: 각 언어별 주요 시나리오 테스트

---

### Phase 2: 점진적 확장 (우선순위: ⭐⭐⭐)

**예상 소요 시간**: 1-2주

#### 백엔드 작업

- [ ] 나머지 Service 레이어 메시지 마이그레이션
  - `CardService`, `ColumnService`, `BoardService` 등
- [ ] API 응답 메시지 다국어화
  - 성공 메시지, 정보 메시지 등
- [ ] 데이터베이스 seed 데이터 다국어 지원
  - 보드 템플릿 이름, 설명 등

#### 프론트엔드 작업

- [ ] 나머지 페이지/컴포넌트 마이그레이션
  - `ProfilePage`, `DashboardPage`, `SearchPage` 등
- [ ] 동적 메시지 처리
  - `{count}개의 카드` → `{{count}} cards` / `{{count}}개의 카드`
- [ ] 날짜/시간 포맷 locale별 처리
  - `date-fns` locale 활용

#### 검증 기준

- [ ] E2E 테스트 스위트 실행 (영어/한국어 각각)
- [ ] UI 스크린샷 비교 테스트
- [ ] 번역 누락 키 자동 검사

---

### Phase 3: 품질 보증 및 최적화 (우선순위: ⭐⭐)

**예상 소요 시간**: 1주

#### 작업 내용

1. **번역 누락 감지**
   - 프론트엔드: `saveMissing: true` 옵션으로 누락된 키 로깅
   - 백엔드: 커스텀 `MessageSourceService`에서 missing key 로깅
   - 자동화 스크립트 작성 (번역 파일 검증)

2. **성능 최적화**
   - 프론트엔드: namespace별 lazy loading 구현
   - 백엔드: MessageSource 캐싱 전략 조정

3. **문서화**
   - `frontend/src/i18n/README.md` 작성
     - 번역 키 추가 가이드
     - 네이밍 컨벤션
     - 사용 예시
   - 백엔드 번역 가이드 작성

4. **CI/CD 통합**
   - 번역 파일 validation script 추가
   - 누락된 번역 키 자동 체크
   - PR 시 번역 파일 변경 검증

#### 검증 기준

- [ ] 모든 번역 키 누락 없음
- [ ] 성능 벤치마크 통과 (초기 로딩 시간 영향 < 5%)
- [ ] CI/CD 파이프라인 통과
- [ ] 문서화 완료

---

## 🚀 빠른 시작 가이드 (Phase 0 구현)

### 백엔드 샘플 코드

#### 1. I18nConfig.java

```java
package com.kanban.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.List;
import java.util.Locale;

@Configuration
public class I18nConfig {

    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setUseCodeAsDefaultMessage(true);
        messageSource.setCacheSeconds(3600); // 운영: 3600, 개발: 0
        return messageSource;
    }

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.ENGLISH);
        resolver.setSupportedLocales(List.of(Locale.ENGLISH, Locale.KOREAN));
        return resolver;
    }
}
```

#### 2. MessageSourceService.java

```java
package com.kanban.util;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageSourceService {

    private final MessageSource messageSource;

    public String getMessage(String code, Object... args) {
        return messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
    }

    public String getMessageOrDefault(String code, String defaultMsg, Object... args) {
        try {
            return getMessage(code, args);
        } catch (NoSuchMessageException e) {
            return defaultMsg;
        }
    }
}
```

#### 3. 사용 예시

```java
// ResourceNotFoundException 리팩토링 전
throw new ResourceNotFoundException("Board not found with ID: " + boardId);

// 리팩토링 후
throw new ResourceNotFoundException(
    messageSourceService.getMessage("error.board.not-found", boardId)
);

// Bean Validation 리팩토링 전
@NotBlank
@Email
private String email;

// 리팩토링 후
@NotBlank(message = "{validation.email.required}")
@Email(message = "{validation.email.invalid}")
private String email;
```

---

### 프론트엔드 샘플 코드

#### 1. i18n/index.ts

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from './locales/en/common.json';
import commonKo from './locales/ko/common.json';
import authEn from './locales/en/auth.json';
import authKo from './locales/ko/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        auth: authEn
      },
      ko: {
        common: commonKo,
        auth: authKo
      }
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ko'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
```

#### 2. main.tsx 수정

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n'; // i18n 초기화 추가

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

#### 3. utils/axios.ts 수정 (Accept-Language 헤더 추가)

```typescript
import i18n from '@/i18n';
import { axiosInstance } from '@/utils/axios';

// Request 인터셉터 수정
axiosInstance.interceptors.request.use((config) => {
  // 기존 인증 로직
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // i18n 언어 헤더 추가
  config.headers['Accept-Language'] = i18n.language;

  return config;
});
```

#### 4. 컴포넌트 사용 예시

```typescript
import { useTranslation } from 'react-i18next';

export const GlobalNavBar: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'notification']);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div>
      {/* 언어 전환 버튼 */}
      <button onClick={() => handleLanguageChange('ko')}>한국어</button>
      <button onClick={() => handleLanguageChange('en')}>English</button>

      {/* 하드코딩 전: "지금 확인하기" */}
      {/* 다국어화 후: */}
      <p>{t('common:action.viewNow')}</p>

      {/* 하드코딩 전: "받은편지함" */}
      {/* 다국어화 후: */}
      <h2>{t('notification:inbox')}</h2>
    </div>
  );
};
```

#### 5. LanguageSwitcher.tsx (언어 전환 컴포넌트)

```typescript
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={currentLanguage === 'en' ? 'font-bold' : ''}
      >
        English
      </button>
      <button
        onClick={() => i18n.changeLanguage('ko')}
        className={currentLanguage === 'ko' ? 'font-bold' : ''}
      >
        한국어
      </button>
    </div>
  );
};
```

---

## 📊 예상 작업량 및 우선순위

| Phase | 작업 내용 | 우선순위 | 예상 소요 시간 | 담당 영역 |
|-------|----------|---------|--------------|----------|
| **Phase 0** | 인프라 구축 | ⭐⭐⭐⭐⭐ | 1-2일 | Backend + Frontend |
| **Phase 1** | 핵심 도메인 다국어화 | ⭐⭐⭐⭐ | 3-5일 | Backend + Frontend |
| **Phase 2** | 점진적 확장 | ⭐⭐⭐ | 1-2주 | Backend + Frontend |
| **Phase 3** | 품질 보증 및 최적화 | ⭐⭐ | 1주 | Backend + Frontend |

**총 예상 소요 시간**: 약 3-4주

---

## ⚠️ 주의사항 및 Best Practices

### 1. 점진적 마이그레이션

- ❌ 한 번에 모든 파일을 수정하려 하지 말 것
- ✅ Phase 0로 인프라 먼저 구축 → Phase 1부터 점진적 마이그레이션
- ✅ 각 Phase별로 검증 후 다음 단계 진행

### 2. 번역 키 네이밍 일관성

- **백엔드**: `error.{domain}.{situation}` 패턴 준수
  - 예: `error.board.not-found`, `validation.email.invalid`
- **프론트엔드**: `{namespace}:{category}.{key}` 패턴 준수
  - 예: `common:button.confirm`, `board:create`

### 3. 테스트 커버리지 유지

- 다국어화 전후 기능 동작 동일성 보장
- 언어별 E2E 테스트 추가
- 번역 파일 검증 자동화

### 4. 성능 고려

- **프론트엔드**: namespace 분리로 초기 번들 크기 최소화
- **백엔드**: MessageSource 캐싱 활성화 (운영: 3600초)
- Lazy loading 적극 활용

### 5. 문서화

- 새로운 번역 키 추가 시 가이드라인 문서 참조
- PR 시 번역 파일도 함께 업데이트
- 번역 누락 검사 스크립트 실행

### 6. 로그 메시지 정책

- ❌ 사용자 대상 메시지: 다국어화 필수
- ✅ 개발자/운영 대상 로그: 영어 고정 (국제 표준)

---

## ✅ 체크리스트

작업이 완료되면 해당 작업에 [x]를 추가해주세요.

### Phase 0 완료 기준

- [x] 백엔드: I18nConfig, MessageSourceService 구현 완료
- [x] 백엔드: messages*.properties 파일 생성 완료 (테스트 메시지 포함)
- [ ] 프론트엔드: i18next 라이브러리 설치 완료
- [ ] 프론트엔드: i18n 설정 파일 생성 완료
- [ ] 프론트엔드: 번역 파일 디렉토리 구조 생성 완료
- [ ] 프론트엔드: LanguageSwitcher 컴포넌트 생성 완료
- [ ] 프론트엔드: Axios 인터셉터에 Accept-Language 헤더 추가 완료
- [ ] 테스트: 언어 전환 동작 확인 완료

### Phase 1 완료 기준

- [ ] 백엔드: 주요 예외 메시지 다국어화 완료
- [ ] 백엔드: Bean Validation 메시지 다국어화 완료
- [ ] 백엔드: 이메일 템플릿 다국어화 완료
- [ ] 프론트엔드: 공통 컴포넌트 다국어화 완료
- [ ] 프론트엔드: 인증 관련 페이지 다국어화 완료
- [ ] 프론트엔드: 보드/카드 관련 컴포넌트 다국어화 완료
- [ ] 프론트엔드: 알림/토스트 메시지 다국어화 완료
- [ ] 테스트: 주요 플로우 언어별 E2E 테스트 통과

### Phase 2 완료 기준

- [ ] 백엔드: 모든 Service 레이어 메시지 다국어화 완료
- [ ] 프론트엔드: 모든 페이지/컴포넌트 다국어화 완료
- [ ] 동적 메시지 처리 구현 완료
- [ ] 날짜/시간 locale별 포맷팅 구현 완료

### Phase 3 완료 기준

- [ ] 번역 누락 검사 스크립트 구현 완료
- [ ] 성능 최적화 완료
- [ ] i18n 가이드 문서 작성 완료
- [ ] CI/CD 파이프라인 통합 완료

---

## 📚 참고 자료

### 공식 문서

- [Spring Framework - Internationalization](https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html#context-functionality-messagesource)
- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)

### 관련 파일

- 백엔드: `backend/CLAUDE.md` (개발 가이드)
- 프론트엔드: `frontend/CLAUDE.md` (개발 가이드)
- 모노레포: `CLAUDE.md` (전체 프로젝트 가이드)

---

## 📝 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2025-11-28 | Claude Code | 초안 작성 |

---

**문서 상태**: ✅ 계획 수립 완료 / ⏳ Phase 0 대기 중
