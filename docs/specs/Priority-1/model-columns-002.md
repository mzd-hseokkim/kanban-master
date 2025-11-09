# model-columns-002 — 컬럼 설계

## 1. 설계 목적
- 컬럼을 워크플로우 단계로 표현하고 순서·WIP 제한·카드 처리 정책을 담는 모델을 정의한다.
- 컬럼 변경 사항이 카드 서비스와 일관되도록 이벤트 흐름을 마련한다.

## 2. 엔터티 정의
### Column
| 필드 | 타입 | 제약/설명 |
|------|------|-----------|
| id | Long | PK |
| board_id | Long | 보드 FK |
| name | String(50) | 필수 |
| description | String(200) | 선택 |
| position | Integer | 0 기반 정렬 인덱스 |
| wip_limit | Integer | 선택, 0이면 제한 없음 |
| color_token | String(20) | 헤더 색상 옵션 (예: pastel-purple-400) |
| policy_on_delete | Enum(`ARCHIVE_CARDS`, `MOVE_TO_COLUMN`) | 기본 정책, 삭제 요청 시 파라미터로 override 가능 |
| created_at / updated_at | DateTime | 감사 로그용 |

### ColumnOrderChange (이벤트 로그)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | |
| board_id | Long | |
| user_id | Long | 변경 사용자 |
| before_positions | JSON(Array) | 변경 전 순서 |
| after_positions | JSON(Array) | 변경 후 순서 |
| changed_at | DateTime | |

## 3. 관계
```
Board 1 ──── * Column
Column 1 ──── * Card (model-cards-003 참조)
```

## 4. 서비스 설계
- **ColumnService**
  - `createColumn(boardId, CreateColumnCommand)` → Column
  - `updateColumn(columnId, UpdateColumnCommand)` → Column
  - `reorderColumns(boardId, List<ColumnPosition>)`
  - `deleteColumn(columnId, DeletePolicy)` → 결과 요약 반환 (아카이브 카드 수 등)
- **DeletePolicy 처리**
  - `ARCHIVE_CARDS`: 해당 컬럼 카드들을 카드 서비스에 일괄 아카이브 요청.
  - `MOVE_TO_COLUMN`: 목표 컬럼 ID 필수, 카드 순서는 목표 컬럼 최하단으로 이동.
- **WIP 검증**
  - 컬럼 내부 카드 수가 `wip_limit` 초과 시 카드 추가/이동 API가 409 오류를 반환하고 사용자에게 경고 메시지 제공.

## 5. 데이터 흐름
1. 컬럼 생성 → position = 보드 내 최댓값 + 1.
2. 드래그앤드롭 → 프론트가 새 순서 배열을 `PUT /columns/reorder`로 전달.
3. 백엔드는 트랜잭션 내에서 position을 일괄 업데이트하고 ColumnOrderChange 이벤트를 기록.
4. 실시간 브로드캐스트(SSE/WebSocket)를 통해 다른 사용자 화면 갱신.

## 6. 검증/오류
- 컬럼 수 제한(최대 20) 초과 시 422 응답.
- 이름 중복 허용하지만, 필요 시 동일 보드 내 중복 방지 옵션을 제공할 수 있음.
- 삭제 시 목표 컬럼 ID가 보드에 속하지 않으면 400 오류.

## 7. 확장 고려
- 컬럼별 SLA 또는 자동화 트리거를 추가하려면 `metadata` JSON을 활용.
- 컬럼 잠금(편집 불가) 상태를 위한 `is_locked` Boolean 필드 추가 가능.
