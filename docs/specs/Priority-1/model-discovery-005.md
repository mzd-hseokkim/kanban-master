# model-discovery-005 — 검색·라벨·템플릿 설계

## 1. 설계 목적
- 대규모 보드/카드 데이터를 효율적으로 탐색하고, 라벨/템플릿 정의를 재사용 가능하게 구조화한다.
- 검색·필터·템플릿 기능이 동일한 소스 데이터를 공유하도록 모델을 설계한다.

## 2. 엔터티 정의
### Label
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | PK |
| board_id | Long | 보드 FK |
| name | String(30) | 필수 |
| color_token | String(20) | 디자인 토큰 값 |
| description | String(100) | 선택 |
| order | Integer | 라벨 목록 정렬 |

### BoardTemplate
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | PK |
| owner_type | Enum(`SYSTEM`, `USER`) | 제공 주체 |
| owner_id | Long | USER 템플릿일 때 사용 |
| name | String(100) | |
| description | String(300) | |
| preset_columns | JSON | 컬럼 배열(이름, 색상, WIP) |
| preset_labels | JSON | 라벨 배열 |
| preset_settings | JSON | 기타 설정(WIP 정책 등) |

### SearchIndex (개념)
- 실제 구현은 DB 뷰, Elastic, 또는 PostgreSQL GIN 인덱스를 활용.
- 인덱스 문서 구조:
```
{
  "resource_type": "CARD" | "BOARD",
  "resource_id": number,
  "board_id": number,
  "title": string,
  "content": string,        // 설명, 댓글 일부
  "assignee_id": number,
  "label_ids": number[],
  "due_date": datetime,
  "status": string
}
```

## 3. 관계
```
Board 1 ──── * Label
Card * ──── * Label (CardLabel 참조)
BoardTemplate ──── presets → Column/Label 설정
SearchIndex ──── references ──── Board/Card
```

## 4. 서비스 설계
- **LabelService**
  - CRUD 제공, 생성/수정 시 관련 카드 캐시 무효화.
  - 라벨 순서 변경 API (`PUT /labels/reorder`)로 UI 정렬 일관성 유지.
- **TemplateService**
  - 시스템 템플릿은 읽기 전용, 사용자 템플릿은 CRUD 가능.
  - 새 보드 생성 시 템플릿 ID를 전달하면 Column/Label 초기값을 반환하는 팩토리 역할.
- **SearchService**
  - `searchCards(SearchQuery)` → 결과 + 페이징.
  - `searchBoards(SearchQuery)` → 보드 결과.
  - 필터 조건: 키워드, assigneeIds, labelIds, dueDate range, status, boardIds.
  - 구현 옵션:
    - 단일 DB: PostgreSQL `tsvector` + GIN 인덱스.
    - 확장 대비: OpenSearch/Elastic으로 전송하는 인덱싱 파이프라인.

## 5. 데이터 흐름
1. 라벨 생성/수정 → Label 테이블 업데이트 → 라벨 캐시 갱신 → 관련 카드 UI 업데이트.
2. 템플릿 저장 → JSON Preset에 컬럼/라벨 구조 저장 → 새 보드 생성 시 적용.
3. 카드/보드 데이터가 변경되면 SearchIndex를 업데이트(동기 또는 비동기 큐).
4. 사용자가 검색/필터 UI에서 조건을 지정하면 SearchService가 결과를 반환, 프론트는 필터 상태를 URL 쿼리로 유지.

## 6. 검증/오류
- 라벨 이름 중복 허용 여부: 기본 허용, 필요 시 `UNIQUE(board_id, name)` 제약 추가 가능.
- 템플릿 JSON 크기 제한(예: 50KB) 초과 시 저장 거부.
- 검색 요청에 필수 조건 없음, 단 페이징 파라미터 기본값(page=1, size=20).

## 7. 확장 고려
- 라벨 색상 사용자 정의를 허용하려면 `color_hex` 필드 추가.
- 템플릿 버전 관리 필요 시 `version` 필드와 변경 이력 테이블 도입.
- 검색 결과 정렬 옵션(마감 임박, 최근 업데이트 등)을 추가하려면 인덱스에 `updated_at` 필드 포함.
