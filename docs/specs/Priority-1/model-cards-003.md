# model-cards-003 — 카드 설계

## 1. 설계 목적
- 카드 엔터티와 이동/아카이브/댓글/라벨 연계를 정의해 업무 단위를 안정적으로 관리한다.
- 카드 상태 변화가 활동 로그, 알림, 검색 기능과 자연스럽게 연결되도록 한다.

## 2. 엔터티 정의
### Card
| 필드 | 타입 | 제약/설명 |
|------|------|-----------|
| id | Long | PK |
| board_id | Long | 보드 FK |
| column_id | Long | 현재 컬럼 |
| title | String(120) | 필수 |
| description | Text | 마크다운 허용 가능 |
| assignee_id | Long | 선택 |
| reporter_id | Long | 최초 작성자 |
| priority | Enum(`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) | 기본 MEDIUM |
| due_date | DateTime | 선택 |
| status | Enum(`ACTIVE`, `ARCHIVED`, `DELETED`) | 아카이브/삭제 관리 |
| sort_order | Decimal | 컬럼 내 정렬(예: 100, 200 …) |
| metadata | JSON | 첨부, 체크리스트 등 확장 영역 |
| created_at / updated_at | DateTime | |

### CardLabel
| 필드 | 타입 | 설명 |
|------|------|------|
| card_id | Long | 복합 PK |
| label_id | Long | 복합 PK |

### CardComment
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | PK |
| card_id | Long | FK |
| author_id | Long | |
| content | Text | 멘션, 링크 지원 |
| created_at | DateTime | |
| updated_at | DateTime | 편집 이력 |

### CardHistory
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | PK |
| card_id | Long | |
| event_type | Enum(`CREATED`, `UPDATED`, `MOVED`, `ARCHIVED`, `DELETED`, `COMMENTED`) | |
| payload | JSON | 이전/이후 컬럼, 값 변경 등 |
| actor_id | Long | |
| created_at | DateTime | |

## 3. 관계
```
Board 1 ──── * Card
Column 1 ──── * Card
Card * ──── * Label (Discovery 모델 참조)
Card 1 ──── * CardComment
Card 1 ──── * CardHistory
```

## 4. 서비스 설계
- **CardService**
  - `createCard(boardId, columnId, CreateCardCommand)`
  - `updateCard(cardId, UpdateCardCommand)`
  - `moveCard(cardId, targetColumnId, targetOrder)`
  - `archiveCard(cardId)` / `restoreCard(cardId)` / `deleteCard(cardId)`
  - `addComment(cardId, authorId, content)` 등 협업 연동.
- **정렬 전략**
  - 새 카드 생성 시 `sort_order` = 컬럼 상단 기준으로 `currentMin - 100`.
  - 드래그앤드롭 이동 시 인접 카드의 sort_order 평균값을 사용하여 재정렬 비용 최소화.
- **이벤트 발행**
  - 이동/편집/댓글 작성 시 `CardHistory` 저장과 동시에 Activity/Notification 서비스에 이벤트 전달.

## 5. 데이터 흐름
1. 카드 생성 → Card 레코드 + CardHistory(CREATED) 기록.
2. 카드 이동 → column_id, sort_order 업데이트 + CardHistory(MOVED) + 알림(담당자에게 전송).
3. 아카이브 → status=ARCHIVED, column_id 유지. 보드 뷰에서 제외되지만 검색/아카이브 뷰에서 조회 가능.
4. 영구 삭제 → status=DELETED, 일정 기간(예: 30일) 후 배치로 물리 삭제.

## 6. 검증/오류
- 제목 미입력 시 422.
- 마감일 과거 날짜 허용 여부는 설정으로 제어(기본 허용, 경고 메시지).
- 다른 보드로 이동 시 권한 확인 필요(목표 보드 접근 가능해야 함).

## 7. 확장 고려
- 첨부 파일, 체크리스트, 서브태스크 등은 `metadata` JSON 또는 별도 테이블로 분리 가능.
- 카드 구독자(Watcher) 기능 추가 시 별도 관계 테이블 `CardWatcher` 도입.
