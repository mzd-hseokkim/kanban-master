# model-auth-000 — 인증·인가 설계

## 1. 설계 목적
- 사용자 인증, 토큰 발급, 권한 평가를 위한 데이터 구조와 서비스 흐름을 정의한다.
- 워크스페이스·보드 권한 모델과 연동되어 모든 요청의 접근 제어를 일관되게 수행한다.

## 2. 엔터티 정의
### User
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | PK |
| email | String(150) | UNIQUE, 로그인 식별자 |
| password_hash | String | Bcrypt 등 강력한 해시 |
| name | String(100) | 표시 이름 |
| avatar_url | String(255) | 선택 |
| status | Enum(`ACTIVE`, `PENDING`, `SUSPENDED`) | |
| last_login_at | DateTime | |
| created_at / updated_at | DateTime | |

### Workspace
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | PK |
| name | String(150) | |
| slug | String(50) | URL friendly |
| owner_id | Long | User FK |

### WorkspaceMember
| 필드 | 타입 | 설명 |
|------|------|------|
| workspace_id | Long | 복합 PK |
| user_id | Long | 복합 PK |
| role | Enum(`OWNER`, `ADMIN`, `MEMBER`, `GUEST`) | |

### AuthToken
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | Long | |
| type | Enum(`REFRESH`, `RESET_PASSWORD`) | |
| expires_at | DateTime | 만료 시각 |
| revoked | Boolean | |
| created_at | DateTime | |

## 3. 관계 다이어그램
```
User 1 ──── * Workspace (owner)
Workspace 1 ──── * WorkspaceMember * ──── 1 User
Workspace 1 ──── * Board (model-boards-001)
Board 1 ──── * BoardMember * ──── 1 User
User 1 ──── * AuthToken
```

## 4. 서비스 설계
- **AuthenticationService**
  - `login(email, password)` → AccessToken + RefreshToken
  - `refresh(token)` → 새 AccessToken
  - `logout(token)` → Refresh 토큰 폐기
  - 비밀번호 재설정, 계정 잠금 감지 로직 포함
- **AuthorizationService**
  - `hasWorkspaceRole(userId, workspaceId, roles[])`
  - `hasBoardRole(userId, boardId, roles[])`
  - 요청 핸들러 전에 호출되어 403/401 분기
- **TokenStrategy**
  - AccessToken(JWT) payload: `sub`, `workspaceIds`, `boardRoles` 최소화
  - RefreshToken: DB/Redis 저장, 탈취 대응을 위해 단일 디바이스 기준으로 관리 가능

## 5. 요청 처리 흐름
1. 사용자가 로그인 → `AuthenticationService`가 사용자 검증 후 AccessToken(JWT)과 RefreshToken(쿠키/스토리지) 발급.
2. 프론트는 AccessToken을 Authorization 헤더로 전송, 서버 필터에서 JWT 서명 검증.
3. 필터는 `AuthorizationService`를 호출해 요청 대상 리소스의 권한을 확인하고, 컨트롤러에 사용자 정보를 전달.
4. AccessToken 만료 시 프론트가 RefreshToken으로 `/auth/refresh` 호출 → 새 AccessToken 수신.
5. 로그아웃 시 RefreshToken 레코드 `revoked` 플래그 설정.

## 6. 오류·보안 시나리오
- 로그인 실패 5회 이상 → 사용자 상태 `SUSPENDED`로 설정하거나 CAPTCHA 요구.
- RefreshToken 탈취 감지 → 해당 토큰 ID를 즉시 revoke, 관련 세션 무효화.
- 워크스페이스 탈퇴 시 해당 사용자의 BoardMember 레코드도 정리.

## 7. 확장 고려
- SSO(OAuth/SAML) 도입 시 `UserIdentity` 테이블을 추가해 외부 프로바이더 ID를 저장.
- 다중 워크스페이스를 쉽게 전환할 수 있도록 AccessToken payload에 선택된 `currentWorkspaceId` 포함.
- 감사 로깅: 로그인/로그아웃/토큰 재발급 이벤트를 Activity 테이블에 기록해 이상 징후를 추적.
