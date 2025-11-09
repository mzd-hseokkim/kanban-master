# model-collab-004 — 협업/활동/알림 설계

## 1. 설계 목적
- 권한, 초대, 활동 로그, 알림 데이터를 통합해 협업 기능을 안정적으로 제공한다.
- 보드·카드 도메인이 생성하는 이벤트를 표준화된 Activity/Notification 모델에 기록한다.

## 2. 엔터티 정의
### BoardMember
| 필드 | 타입 | 설명 |
|------|------|------|
| board_id | Long | 복합 PK |
| user_id | Long | 복합 PK |
| role | Enum(`VIEWER`, `EDITOR`, `MANAGER`) | 권한 |
| invitation_status | Enum(`PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`) |
| invitation_token | String(64) | 초대 링크 식별자 |
| invited_at | DateTime | |
| accepted_at | DateTime | 선택 |

### Activity
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | PK |
| scope_type | Enum(`BOARD`, `CARD`) | 범위 |
| scope_id | Long | 보드 또는 카드 ID |
| actor_id | Long | 수행 사용자 |
| event_type | Enum(`BOARD_CREATED`, `COLUMN_REORDERED`, `CARD_MOVED`, `COMMENT_ADDED`, `MEMBER_INVITED`, …) |
| payload | JSON | 추가 데이터(예: 이전/이후 값) |
| created_at | DateTime | |

### Notification
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | PK |
| user_id | Long | 수신자 |
| event_type | Enum(`MENTION`, `ASSIGNED`, `DUE_SOON`, `COMMENT_REPLY`, …) |
| title | String(120) | 알림 요약 |
| body | String(500) | 상세 메시지 |
| resource_type | Enum(`CARD`, `BOARD`) | 관련 리소스 |
| resource_id | Long | |
| is_read | Boolean | 읽음 여부 |
| created_at | DateTime | |
| read_at | DateTime | 선택 |

## 3. 관계
```
Board 1 ──── * BoardMember * ──── 1 User
Activity ──── references ──── Board/Card
Notification ──── references ──── Board/Card
```

## 4. 서비스 설계
- **MemberService**
  - 초대 생성 → BoardMember 레코드 생성(PENDING), 초대 토큰 발급.
  - 초대 수락 → role 부여, accepted_at 기록.
  - 권한 변경 → activity 기록 + 즉시 반영, 다운그레이드 시 편집 세션 차단.
- **ActivityService**
  - 도메인 이벤트 수신 → Activity 레코드 저장.
  - `listActivities(scopeType, scopeId, filter)` 제공, 페이지네이션.
  - “내 활동만” 필터: actor_id = current user 조건.
- **NotificationService**
  - Activity/Event 기반으로 알림 규칙 평가.
    - 예: 카드 담당자 변경 → `ASSIGNED` 알림 발행.
    - 댓글 @멘션 → `MENTION` 알림 발행.
  - 읽음 처리 API → `is_read=true`, `read_at` 기록.

## 5. 데이터 흐름
1. 사용자가 카드를 이동하면 CardService가 도메인 이벤트를 발행.
2. ActivityService가 이벤트를 Activity 테이블에 기록하고, NotificationService가 수신자(담당자 등)를 계산해 알림 생성.
3. 프론트는 SSE/WebSocket으로 알림 스트림을 받아 헤더 뱃지를 갱신.
4. 사용자가 알림 드롭다운을 열면 `GET /notifications` 응답을 표시하고, 개별 또는 전체 읽음 요청을 통해 상태 업데이트.

## 6. 검증/오류
- 초대 토큰 만료(72시간) 이후 접근 시 410 Gone 반환.
- 권한 변경 요청자가 MANAGER 권한이 아니면 403.
- 알림 읽음 처리 시 다른 사용자 ID로 요청하면 403.

## 7. 확장 고려
- 이메일/푸시 채널이 필요할 경우 Notification에 `delivery_channels` JSON, `delivery_status` 필드 추가.
- 활동 로그에 diff를 구조화하려면 `payload` 내에 `before`/`after` 객체를 표준화.
- SSO 사용자 초대 시 외부 디렉터리 연동 정보를 BoardMember에 보관할 수 있도록 `external_id` 필드 추가.
