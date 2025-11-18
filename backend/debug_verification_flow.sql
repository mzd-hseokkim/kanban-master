-- 이메일 인증 플로우 디버깅
-- H2 콘솔(http://localhost:8080/h2-console)에서 실행하세요

-- 1. 가장 최근 회원가입한 사용자 확인
SELECT
    id,
    email,
    name,
    status,
    email_verified,
    verification_token,
    verification_token_expiry,
    created_at,
    updated_at
FROM users
WHERE status = 'PENDING' OR email_verified = FALSE
ORDER BY created_at DESC
LIMIT 5;

-- 2. 특정 토큰으로 사용자 조회 (실제 토큰 값으로 교체하세요)
-- SELECT * FROM users WHERE verification_token = 'your-token-here';

-- 3. 모든 사용자의 인증 상태 확인
SELECT
    status,
    email_verified,
    COUNT(*) as user_count
FROM users
GROUP BY status, email_verified;
