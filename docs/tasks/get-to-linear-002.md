# Task: Global Keyboard Shortcuts

## Goal
마우스 의존도를 낮추고 "Power User"를 위한 **키보드 단축키** 시스템을 구축합니다. Linear의 "Speed" 철학을 반영하여, 숙련된 사용자가 화면을 보지 않고도 작업을 수행할 수 있도록 합니다.

## Requirements

### 1. Essential Shortcuts
다음 단축키는 필수적으로 구현되어야 합니다:

| Key | Action | Context |
| :--- | :--- | :--- |
| `C` | **C**reate Issue (이슈 생성 모달 열기) | Global |
| `Esc` | Close Modal / Clear Selection | Modal, Selected State |
| `Cmd/Ctrl` + `Enter` | Submit Form (저장/생성) | Forms (Issue Create, Edit) |
| `Space` | Assign to Me (나에게 할당) | Card Hover / Selection |
| `/` | Focus Search Input | Global |

### 2. Vim-style Navigation (Optional but Recommended)
-   `J` / `K`: 리스트 내에서 카드 상하 이동 (포커스 이동)
-   `H` / `L`: 컬럼 간 좌우 이동

## Tech Stack Recommendation
-   **Library**: `react-hotkeys-hook` 또는 Custom Hook (`useKeyboardShortcut`)
-   **UX**: 단축키 사용 시 화면 하단에 미묘한 토스트 메시지나 힌트를 보여주어 학습을 유도하면 좋습니다.

## Implementation Steps
1.  `useKeyboardShortcut` 훅 구현 (또는 라이브러리 설치).
2.  `App.tsx` 레벨에서 Global Listener 등록 (`C`, `/` 등).
3.  각 컴포넌트(`EditCardModal`, `BoardPage`)에서 Contextual Listener 등록.
4.  입력 폼(`input`, `textarea`) 포커스 상태일 때는 단축키 비활성화 처리 필수.
