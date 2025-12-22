# Token 기반 API 접근 지원 - 계획/설계/세부작업/우선순위

## 개요
- 목적: JWT 로그인과 별도로 API 토큰을 통해 보드/카드 관련 API를 제어할 수 있도록 지원한다.
- 범위: 토큰 관리(생성/목록/폐기), 토큰별 권한 관리, 토큰 인증을 사용하는 보드/카드 API 접근.
- 전제: 기존 사용자 권한(보드 역할)을 초과하지 않는 범위에서 토큰 권한을 부여한다.

## 설계 원칙
- 토큰 값은 생성 시 1회만 노출하고, 저장 시에는 해시만 보관한다.
- 토큰 인증은 기존 JWT 인증과 병행하되, 충돌 시 JWT를 우선한다.
- 토큰은 보드/카드 관련 엔드포인트에만 접근할 수 있도록 제한한다.
- 토큰 권한은 보드 역할(뷰어/에디터/매니저) 및 스코프(읽기/쓰기/관리)로 구성한다.
- 감사 추적을 위해 마지막 사용 시각과 폐기 상태를 기록한다.

## 권한 모델 제안
- 역할: BOARD_VIEWER, BOARD_EDITOR, BOARD_MANAGER
- 스코프 예시: board.read, board.write, card.read, card.write, card.archive
- 상한 규칙: 토큰 생성 시점에 생성자의 보드 역할/권한을 초과하지 못한다.
- 범위: 토큰은 boardId 단위로 유효하며, 요청 경로의 boardId와 일치해야 한다.

## 인증 흐름 제안
- 헤더: Authorization: Bearer <token>
- 토큰 구분: 고정 prefix(예: kbp_) 또는 별도 헤더를 통해 API 토큰과 JWT를 구분한다.
- 필터 동작:
  - API 토큰 형식이면 토큰 테이블에서 해시 비교 후 사용자/권한 주입
  - JWT 형식이면 기존 JWT 흐름 유지
  - 둘 다 있으면 JWT 우선
- SecurityContext에 사용자 ID와 토큰 권한 정보를 함께 주입한다.

## API 설계(관리용)
- POST /api/v1/api-tokens: 토큰 생성
  - 입력: name, boardId, role, scopes, expiresAt(옵션)
  - 출력: token(1회), tokenPrefix, role, scopes, expiresAt
- GET /api/v1/api-tokens: 토큰 목록
  - 출력: tokenPrefix, role, scopes, expiresAt, lastUsedAt, revokedAt
- DELETE /api/v1/api-tokens/{id}: 토큰 폐기
- POST /api/v1/api-tokens/{id}/rotate: 토큰 교체(선택)

## 보드/카드 API 적용 범위
- 기존 보드/카드 API는 유지하며, 인증 방식만 확장한다.
- 요청 경로에 포함된 boardId가 토큰의 boardId와 일치해야 한다.
- 스코프와 역할에 맞는 접근만 허용한다.

## 감사 및 보안
- 토큰 사용 시 lastUsedAt 갱신
- 만료/폐기 토큰 사용 시도는 보안 로그에 기록
- 토큰 목록/상세 API에는 원문 토큰을 노출하지 않는다.

## DDL (초안)
- 아래 DDL은 새 테이블과 인덱스만 포함한다. 기존 스키마와 타입/네이밍 규칙은 실제 환경에 맞게 조정한다.

```sql
CREATE TABLE api_tokens (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    token_prefix VARCHAR(16) NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    owner_user_id BIGINT NOT NULL,
    board_id BIGINT NOT NULL,
    role VARCHAR(32) NOT NULL,
    scopes VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_api_tokens_token_hash ON api_tokens (token_hash);
CREATE INDEX ix_api_tokens_owner_user_id ON api_tokens (owner_user_id);
CREATE INDEX ix_api_tokens_board_id ON api_tokens (board_id);
CREATE INDEX ix_api_tokens_expires_at ON api_tokens (expires_at);
```

## 세부 작업 목록
1) 인증/인가 설계 확정
- API 토큰과 JWT의 구분 방식 확정(prefix 또는 별도 헤더)
- SecurityContext에 주입할 principal 모델 정의

2) 데이터 모델 및 저장 정책 확정
- 토큰 해시 알고리즘 결정(단방향)
- 토큰 만료 정책 결정(기본 만료/무기한 허용 여부)
- 토큰 스코프 문자열 규칙 확정

3) 권한 체크 통합
- 보드/카드 권한 검증 로직에 토큰 권한 경로 추가
- 토큰 스코프와 보드 역할 매핑 규칙 확정

4) 관리 API 설계 확정
- 요청/응답 스펙 정의
- 토큰 노출 정책(생성/교체 시 1회) 확정

5) 운영/감사 로깅 설계
- lastUsedAt 갱신 시점 정의
- 만료/폐기 사용 시도 로깅 정책 정의

6) 테스트 범위 정의
- 단위 테스트 항목 정의
- 통합 테스트 시나리오 정의

## 우선순위
- P0: 인증 흐름, 토큰 해시 저장 정책, 권한 상한 규칙(기존 보드 역할 초과 금지)
- P1: 보드/카드 API 권한 체크 통합, 관리 API 기본 CRUD
- P2: 토큰 교체(rotate), 상세 감사 이벤트, 추가 스코프 세분화

## 리스크 및 의사결정 필요 사항
- 토큰 범위를 보드 단위로 고정할지, 워크스페이스 단위까지 허용할지 결정 필요
- 토큰 만료 기본값 및 무기한 허용 여부 결정 필요
- 토큰 접근 허용 엔드포인트 범위(필터 allowlist vs 권한 체크 일괄 적용) 결정 필요
- 프론트 UI 제공 여부(설정/프로필 페이지) 결정 필요
