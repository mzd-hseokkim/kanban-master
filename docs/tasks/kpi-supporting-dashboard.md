# KPI 지원 대시보드 작업 메모

- 목적: 전역/보드 인사이트용 KPI를 도입하기 위한 백엔드·프론트엔드 변경 계획을 기록합니다.
- 전제: 카드에 `startedAt`, `completedAt` 필드를 추가하고, 전역/보드 인사이트 API를 신설하며, 5분 LRU 캐시(Caffeine 가정)를 적용합니다.

## 할 일 체크리스트
- [x] 데이터 모델 확장: Card 엔티티에 `startedAt`, `completedAt` 추가 및 완료/재개 활동 로그 이벤트 타입(`CARD_STARTED`, `CARD_COMPLETED`, `CARD_REOPENED` 등) 정의
- [x] 완료/재개/시작 진입점: 카드 완료/재개(또는 시작) API 설계/추가 및 서비스 로직에서 `startedAt`/`completedAt` 세팅 (프론트 카드 상세에 시작 버튼 노출)
- [ ] 전역 요약 API: `GET /api/v1/workspaces/{workspaceId}/dashboard/summary` DTO·리포지토리·컨트롤러 추가 (5분 캐시)
- [ ] 보드 인사이트 API: `GET /api/v1/workspaces/{workspaceId}/boards/{boardId}/insights` DTO·리포지토리·컨트롤러 추가 (5분 캐시)
- [ ] 캐싱: Summary/Insights API에 Caffeine 5분 LRU 캐시 적용, 카드/컬럼/보드 변경 및 완료/재개 시 캐시 무효화
- [ ] 프론트 대시보드: 새 Summary API 연동, KPI 타일·Top 보드·활동 추이 섹션 추가
- [ ] 보드 화면 인사이트: 헤더 하단 인사이트 패널 추가(컬럼별 수·지연/임박·완료율·우선순위·담당자 분포·마감 없음)
- [ ] QA: 지연/임박(48h) 계산 검증, 캐시 만료/무효화 동작 확인, 로딩/에러 핸들링 점검

## KPI 범위(1차 릴리스)
- 전역: 활성 보드 수, 전체/완료/미완료 카드, 지연 카드, 마감 48h 이내 카드, 우선순위 HIGH & 미지정 담당 카드, 지연 카드가 많은 보드 Top N, 최근 7일 카드 생성/업데이트 수(활동 로그 기반)
- 보드별: 컬럼별 카드 수 및 지연/임박 수, 완료/미완료 비율, 우선순위 분포, 담당자별 미완료/지연 카드 수, 마감일 없는 미완료 카드 수

## 캐시 정책
- Caffeine LRU `maximumSize`(예: 500) + `expireAfterWrite=5m`.
- 캐시 타깃: `dashboardSummary`(workspaceId), `boardInsights`(boardId).
- 캐시 무효화 트리거: 카드 생성/수정/삭제/이동/완료/재개, 컬럼 생성/삭제/이동, 보드 상태 변경.

## API 설계(초안)
### 전역 요약
- `GET /api/v1/workspaces/{workspaceId}/dashboard/summary`
- 응답 예시
  ```json
  {
    "totalBoards": 8,
    "totalCards": 120,
    "completedCards": 45,
    "incompleteCards": 75,
    "overdueCards": 9,
    "dueSoonCards": 12,
    "unassignedHighPriorityCards": 4,
    "boardsByOverdue": [
      { "boardId": 11, "boardName": "프로젝트 A", "overdue": 4 },
      { "boardId": 12, "boardName": "프로젝트 B", "overdue": 3 },
      { "boardId": 15, "boardName": "운영", "overdue": 2 }
    ],
    "recentActivity": {
      "created7d": 30,
      "updated7d": 55
    }
  }
  ```
- 계산 규칙:  
  - 지연: `dueDate < 오늘 && isCompleted = false`  
  - 임박: `dueDate ≤ 오늘+2일 && isCompleted = false`  
  - 최근 7일 생성/업데이트: 활동 로그 기준(없으면 카드 createdAt/updatedAt 대체 가능)
### 보드 인사이트
- `GET /api/v1/workspaces/{workspaceId}/boards/{boardId}/insights`
- 응답 예시
  ```json
  {
    "byColumn": [
      { "columnId": 21, "name": "Todo", "total": 10, "overdue": 2, "dueSoon": 3 },
      { "columnId": 22, "name": "In Progress", "total": 8, "overdue": 1, "dueSoon": 4 },
      { "columnId": 23, "name": "Done", "total": 20, "overdue": 0, "dueSoon": 0 }
    ],
    "completion": { "completed": 20, "incomplete": 18 },
    "priority": { "high": 6, "medium": 14, "low": 18 },
    "byAssignee": [
      { "assigneeId": 5, "name": "홍길동", "total": 12, "overdue": 2 },
      { "assigneeId": 7, "name": "김철수", "total": 8, "overdue": 1 },
      { "assigneeId": null, "name": null, "total": 4, "overdue": 1 }
    ],
    "noDueDate": 9
  }
  ```
- 계산 규칙: 전역과 동일한 지연/임박 정의, `noDueDate`는 미완료 + 마감일 없는 카드 수

## 프론트/UX 반영 포인트
- 전역 대시보드: 기존 임박/지연/진행 중 카드 그리드 유지 + 상단 KPI 타일(보드 수, 완료/미완료, 지연, 임박, 고우선 미지정) + 지연 많은 보드 Top N 리스트 + 최근 7일 생성/업데이트 스파크라인. Summary API로 데이터 대체.
- 보드 화면: BoardHeader 하단에 “보드 인사이트” 섹션 추가(컬럼별 카드/지연/임박 바차트, 완료율 도넛, 우선순위 스택 바, 담당자별 미완료/지연 테이블, 마감 없음 배지). Insights API 연동.
- 드릴다운: 타일/리스트 클릭 시 해당 보드/컬럼/카드로 이동(기존 `?cardId=&columnId=` 파라미터 활용).
