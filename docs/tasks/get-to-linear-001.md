# Task: Implement Command Palette (Cmd+K)

## Goal
Linear와 같은 "키보드 중심" 경험의 핵심인 **Command Palette**를 도입합니다. 사용자는 마우스 없이 `Cmd+K` (Windows: `Ctrl+K`)를 통해 애플리케이션의 모든 기능에 접근할 수 있어야 합니다.

## Requirements

### 1. Core Functionality
-   **Global Trigger**: 어디서든 `Cmd+K` / `Ctrl+K`를 누르면 모달 형태의 커맨드 팔레트가 열려야 합니다.
-   **Fuzzy Search**: 정확한 검색어가 아니더라도 유사한 명령을 찾을 수 있어야 합니다.
-   **Keyboard Navigation**: 화살표 키(`↑`, `↓`)로 항목 이동, `Enter`로 실행.

### 2. Command Groups
팔레트 내 명령은 다음과 같이 그룹화되어야 합니다:

#### Navigation (이동)
-   `Go to Board`: 특정 보드로 이동
-   `Go to Analytics`: 분석 페이지로 이동
-   `Go to Settings`: 설정 페이지로 이동

#### Actions (액션)
-   `Create New Issue`: 이슈 생성 모달 열기 (`C` 단축키와 동일 효과)
-   `Change Theme`: 다크/라이트 모드 토글 (현재는 다크 모드 중심이지만 추후 대비)

#### Contextual Actions (문맥 기반 액션)
-   현재 보고 있는 보드나 이슈에 따라 동적으로 명령이 추가될 수 있어야 합니다. (예: "Archive this card")

## Tech Stack Recommendation
-   **Library**: `cmdk` (Vercel에서 만든 빠르고 가벼운 React용 Command Palette 라이브러리)
-   **Styling**: Tailwind CSS + Glassmorphism (기존 디자인 시스템 유지)

## Implementation Steps
1.  `cmdk` 패키지 설치.
2.  `CommandPalette` 컴포넌트 생성 (Global Overlay).
3.  `App.tsx` 또는 최상위 레이아웃에 배치.
4.  기본적인 Navigation 및 Action 등록.
5.  디자인 시스템(`glass-modal`) 적용하여 이질감 없애기.
