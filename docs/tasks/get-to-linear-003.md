# Task: Optimistic UI Updates

## Goal
사용자의 액션에 대해 **즉각적인 피드백**을 제공하여 "로딩 없는" 경험을 만듭니다. 서버 응답을 기다리지 않고 UI를 먼저 업데이트한 후, 백그라운드에서 동기화를 수행합니다.

## Requirements

### 1. Target Scenarios
다음 인터랙션에서 로딩 스피너(Spinner)를 제거하고 즉시 반영해야 합니다:

-   **Card Drag & Drop**: 카드를 다른 컬럼으로 이동할 때.
-   **Status Change**: 완료 체크박스 클릭 시.
-   **Text Edit**: 카드 제목/내용 수정 시 (Debounce 적용).

### 2. Error Handling
-   서버 요청 실패 시, UI를 이전 상태로 **Rollback** 해야 합니다.
-   사용자에게는 조용히(Toast) 에러를 알리고, 재시도 옵션을 제공합니다.

## Tech Stack Recommendation
-   **React Query (`@tanstack/react-query`)**: `useMutation`의 `onMutate`, `onError`, `onSettled` 라이프사이클 활용.

## Implementation Steps
1.  `useMoveCard` 등 주요 Mutation 훅 리팩토링.
2.  `onMutate`:
    *   `cancelQueries`: 진행 중인 관련 쿼리 취소.
    *   `getQueryData`: 현재 상태 스냅샷 저장 (Rollback용).
    *   `setQueryData`: UI를 예측된 성공 상태로 강제 업데이트.
3.  `onError`: 저장해둔 스냅샷으로 데이터 복구.
4.  `onSettled`: 서버 데이터와 확실한 동기화를 위해 `invalidateQueries` 실행.
