# Task: Design Refinement (Typography & Spacing)

## Goal
현재의 화려한 Glassmorphism을 정제하여 **"정보 중심(Content-First)"**의 디자인으로 발전시킵니다. 가독성을 높이고 시각적 소음(Visual Noise)을 줄여 Linear 특유의 "Clean & Professional" 룩을 완성합니다.

## Requirements

### 1. Typography
-   **System Font Stack**: 웹 폰트 로딩 딜레이를 없애고 OS 네이티브 느낌을 주기 위해 시스템 폰트 우선 사용.
    *   `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, ...`
-   **Hierarchy**: 글자 크기보다는 **색상(Color)과 두께(Weight)**로 위계를 구분.
    *   Heading: High Contrast (거의 흰색)
    *   Body: Medium Contrast (회색)
    *   Meta: Low Contrast (어두운 회색)

### 2. Spacing & Density
-   **Compact Mode**: 한 화면에 더 많은 정보가 보이도록 패딩(Padding)과 마진(Margin)을 미세 조정.
-   **Consistent Grid**: 4px 그리드 시스템을 엄격하게 적용.

### 3. Visual Noise Reduction
-   **Glassmorphism Tone-down**:
    *   배경 블러(Backdrop Blur)는 유지하되, 컨테이너의 투명도를 낮추고 테두리(Border)를 더 얇고 섬세하게 변경 (`1px` -> `0.5px` 느낌).
    *   그림자(Shadow)를 줄이고 대신 **Highlight Border** (상단 1px 흰색) 등을 사용하여 깊이감 표현.

## Implementation Steps
1.  `tailwind.config.js` 수정: 폰트 스택 및 컬러 팔레트(Gray Scale) 재정의.
2.  `index.css`: 기본 Glass 클래스(`glass`, `glass-card`)의 투명도 및 보더 스타일 조정.
3.  `Card` 컴포넌트 스타일 리팩토링: 패딩 축소, 폰트 사이즈/컬러 조정.
4.  `Column` 컴포넌트 스타일 리팩토링: 헤더 높이 축소, 리스트 간격 조정.
