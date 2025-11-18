-- 사용자별 인증 토큰 상태 확인
SELECT 
    id, 
    email, 
    name,
    email_verified,
    verification_token,
    verification_token_expiry,
    status,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
