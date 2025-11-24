# Roadmap to Linear-Grade Quality

이 문서는 현재 Kanban 프로젝트를 Linear 수준의 고품질 제품 개발 도구로 발전시키기 위한 포괄적인 분석 및 로드맵입니다. Linear의 핵심 철학인 **"Speed(속도)", "Flow(몰입)", "Craftsmanship(장인정신)"**을 기준으로 현재 상태를 진단하고 구체적인 실행 방안을 제안합니다.

## 1. Core Philosophy & UX (핵심 철학 및 사용자 경험)

Linear가 사랑받는 가장 큰 이유는 "도구가 방해되지 않는 속도감"입니다. 현재 우리 프로젝트는 "기능적인 칸반 보드"이지만, Linear는 "업무를 위한 운영체제"처럼 느껴집니다.

### 🛑 Gap Analysis
| 구분 | Current State (현재) | Linear Standard (목표) |
| :--- | :--- | :--- |
| **입력 방식** | 마우스 중심 (Drag & Drop, 클릭) | **키보드 중심 (Keyboard-First)**. 마우스는 거들 뿐. |
| **탐색** | 메뉴/네비게이션 바 클릭 | **Command Palette (`Cmd+K`)**. 어디서든 즉시 이동/실행. |
| **반응 속도** | 서버 응답 대기 (Loading Spinner) | **Optimistic UI**. 사용자가 액션을 취하면 즉시 반영, 서버 통신은 백그라운드 처리. |
| **워크플로우** | 자유로운 이동 | **Opinionated Workflow**. (Triage -> Backlog -> Active -> Done)의 명확한 흐름 강제. |

### 🚀 Action Items
1.  **Command Palette (`Cmd+K`) 구현**
    *   **기능**: 이슈 생성, 페이지 이동, 뷰 변경, 테마 변경 등 모든 액션을 검색창 하나로 해결.
    *   **Tech**: `cmdk` 라이브러리 도입 추천.
2.  **Global Keyboard Shortcuts (단축키)**
    *   `C`: Create Issue
    *   `Esc`: Close Modal
    *   `J`/`K`: 리스트 내 상하 이동 (Vim 스타일)
    *   `Space`: Assign to me
3.  **Optimistic Updates (낙관적 업데이트)**
    *   카드 이동, 상태 변경 시 서버 응답을 기다리지 않고 UI를 먼저 업데이트. 실패 시 롤백.
    *   `React Query`의 `onMutate` 등을 적극 활용하여 "로딩 없는 경험" 제공.

## 2. UI Design & Aesthetics (디자인 및 미학)

현재의 **"Vibrant Dark Glassmorphism"**은 화려하고 예쁘지만, 장시간 사용하는 생산성 도구로서는 **Visual Noise(시각적 소음)**가 높을 수 있습니다. Linear의 디자인은 "Utilitarian Beauty(실용적 아름다움)"를 추구합니다.

### 🛑 Gap Analysis
| 구분 | Current State (현재) | Linear Standard (목표) |
| :--- | :--- | :--- |
| **스타일** | Glassmorphism (블러, 투명도, 그라디언트) | **High Contrast & Minimal**. 콘텐츠(텍스트)가 가장 돋보임. |
| **레이아웃** | 여백이 많고 장식적 요소 존재 | **Information Density(정보 밀도)**가 높지만 답답하지 않음. |
| **애니메이션** | 부드러운 전환 (Transition) | **Snappy & Physics-based**. 빠르고 절도 있는 모션 (60fps 필수). |
| **타이포** | 가독성 중심 | **System Font Stack**. OS 네이티브 폰트를 사용하여 이질감 제거. |

### 🚀 Action Items
1.  **Refine Glassmorphism (디자인 정제)**
    *   배경의 화려한 Mesh Gradient는 유지하되, 작업 영역(카드, 리스트)의 투명도를 낮추고 **Contrast(대비)**를 높여 가독성 확보.
    *   "예쁨"보다는 "정보의 위계"에 집중.
2.  **Micro-interactions (마이크로 인터랙션)**
    *   카드 드래그 시의 물리적 반동, 체크박스 클릭 시의 햅틱 피드백(모바일), 완료 시의 미묘한 파티클 효과 등 "손맛" 추가.
3.  **Dark Mode Perfection**
    *   단순 반전이 아닌, 깊이감 있는 Dark Gray 스케일 사용. (Linear는 완전 Black이 아닌 세련된 Dark Theme 사용)

## 3. Technology & Performance (기술 및 성능)

Linear는 웹 기술의 한계를 뛰어넘는 성능을 보여줍니다. 이를 위해선 일반적인 SPA 아키텍처를 넘어선 최적화가 필요합니다.

### 🛑 Gap Analysis
| 구분 | Current State (현재) | Linear Standard (목표) |
| :--- | :--- | :--- |
| **데이터 동기화** | REST API + WebSocket (부분적) | **Sync Engine**. 로컬 DB(IndexedDB)와 서버의 실시간 동기화. |
| **오프라인** | 불확실함 | **Offline-First**. 인터넷 없이도 조회/수정 가능, 연결 시 동기화. |
| **이미지/에셋** | 일반 로딩 | **BlurHash / Progressive Loading**. 레이아웃 시프트(CLS) 제로. |

### 🚀 Action Items
1.  **Real-time Multiplayer (실시간 협업)**
    *   현재 WebSocket(`stompjs`)이 있으므로, 이를 확장하여 **"다른 사용자의 커서 위치", "실시간 타이핑 표시"** 등 Presence 기능 강화.
    *   보드 내 카드 이동이 다른 사용자 화면에서도 물 흐르듯 자연스럽게 동기화되어야 함.
2.  **Performance Tuning**
    *   가상화(Virtualization): 칸반 리스트에 카드가 1000개 있어도 버벅이지 않도록 `react-window` 등 도입.
    *   Bundle Size 최적화: 초기 로딩 속도 극대화.

## 4. Product & Marketing (제품 및 마케팅)

Linear는 단순한 툴이 아니라 "일하는 방식(Method)"을 팝니다.

### 🚀 Action Items
1.  **"The Kanban Method" 브랜딩**
    *   단순히 "할 일 관리"가 아니라, "소프트웨어 개발 사이클(Cycle)" 개념 도입.
    *   Insight/Analytics 기능을 통해 팀의 속도(Velocity)와 병목을 시각화 (이미 진행 중인 Analytics 통합과 일치).
2.  **Target Audience**
    *   "모든 사람"이 아닌 **"High-Performance Product Team"**을 타겟팅.
    *   랜딩 페이지 카피: "Built for builders", "Stop managing, start building".

---

## 🎯 Immediate Next Steps (당장 시작할 것)

Linear급으로 가기 위해 가장 가성비 높고 임팩트 있는 작업 순서입니다.

1.  **[UX] Command Palette (`Cmd+K`) 도입**: 사용성을 완전히 바꿉니다.
2.  **[UX] Global Keyboard Shortcuts**: 마우스 없이 이슈 생성/이동 구현.
3.  **[Tech] Optimistic UI 적용**: 카드 이동 시 로딩 인디케이터 제거.
4.  **[Design] Typography & Spacing 정밀 조정**: 픽셀 퍼펙트한 정렬과 가독성 확보.
