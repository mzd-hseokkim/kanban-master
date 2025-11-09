# model-boards-001 — 보드 관리 설계

## 1. 설계 목적
- 보드 라이프사이클(생성→편집→삭제)을 일관된 데이터 모델과 서비스 계층으로 구현한다.
- 보드와 워크스페이스, 사용자, 템플릿 간 연관관계를 명확히 정의하여 향후 권한·통계 기능의 기반을 마련한다.

## 2. 엔터티 정의
### Board
| 필드 | 타입 | 제약/설명 |
|------|------|-----------|
| id | Long | PK |
| workspace_id | Long | 보드가 속한 워크스페이스 |
| owner_id | Long | 최초 생성자, 관리자 권한 기본 부여 |
| name | String(100) | 고유 아님, 워크스페이스 내에서 중복 허용 여부는 정책 선택 |
| description | String(500) | 선택 |
| theme_color | String(20) | 디자인 토큰 (예: pastel-blue-500) |
| icon | String(30) | 아이콘 키 (예: sparkles) |
| status | Enum(`ACTIVE`, `ARCHIVED`, `DELETED`) | 소프트 딜리트/아카이브 상태 |
| deleted_at | DateTime | `DELETED` 상태에서만 채워짐 |
| created_at / updated_at | DateTime | 감사 로그용 |

### BoardTemplate (참조)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | 템플릿 식별자 |
| name | String(100) | 템플릿 이름 |
| description | String(300) | 요약 |
| default_columns | JSON | 컬럼 시퀀스와 이름 |
| default_labels | JSON | 라벨 목록 |

### BoardMember (권한 확장 대비)
| 필드 | 타입 | 설명 |
|------|------|------|
| board_id | Long | 복합 PK |
| user_id | Long | 복합 PK |
| role | Enum(`VIEWER`, `EDITOR`, `MANAGER`) | 보드 내 권한 |
| invited_by | Long | 초대한 사용자 |
| invitation_status | Enum(`PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`) | 협업 spec과 연계 |

## 3. 관계 다이어그램 (ASCII)
```
Workspace 1 ──── * Board
Board 1 ──── * BoardMember * ──── 1 User
Board (template_id) ──── 0..1 BoardTemplate
Board 1 ──── * Column (model-columns-002 참조)
```

## 4. 서비스/도메인 설계
- **BoardService**
  - `createBoard(CreateBoardCommand)` → BoardAggregate
    - 템플릿 ID가 있는 경우 컬럼·라벨 초기 데이터를 이벤트로 발생.
  - `updateBoard(UpdateBoardCommand)` → Snapshot
  - `archiveBoard(BoardId)` / `restoreBoard(BoardId)` / `deleteBoard(BoardId)`
    - 삭제 전 아카이브 상태로 이동 후 일정 기간 경과 시 `DELETED` 전환.
- **정책**
  - 삭제 보호: `DELETED` 상태로 이동 후 30일 경과 시 물리 삭제 배치 실행.
  - 최근 보드: `updated_at` 기준 상위 N개를 캐싱해 대시보드에 노출.

## 5. 데이터 흐름
1. 사용자가 보드 생성 모달에서 입력 제출 → 프론트가 `POST /boards` 호출.
2. 서버는 Board, BoardMember(owner) 레코드와 템플릿 적용 이벤트 생성.
3. 프론트는 응답을 바탕으로 보드 리스트 캐시 갱신 + 성공 토스트 출력.
4. 삭제 요청 시 `status=DELETED`로 표시하고 즉시 리스트에서 제거하지만, 복구 API `POST /boards/{id}/restore` 제공.

## 6. 오류/검증 시나리오
- 중복 이름: 워크스페이스 정책에 따라 허용/거부, 거부 시 “동일한 이름이 이미 존재합니다” 메시지 반환.
- 권한 부족: owner 또는 MANAGER 역할만 편집/삭제 가능, HTTP 403 반환.
- 삭제 가능 조건: 이미 `DELETED` 상태이거나 권한 없으면 실패.

## 7. 확장 고려
- 다국어 보드 이름, 보드 표지 이미지 등 확장 필드는 `metadata` JSON 컬럼으로 보완 가능.
- 향후 보드 카테고리/폴더를 지원할 경우 `category_id` 외래키 추가.
