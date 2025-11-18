-- userId=6 사용자의 인증 상태 확인
SELECT
    id,
    email,
    name,
    status,
    email_verified,
    verification_token,
    verification_token_expiry,
    email_verified_at,
    created_at,
    updated_at
FROM users
WHERE id = 6;
