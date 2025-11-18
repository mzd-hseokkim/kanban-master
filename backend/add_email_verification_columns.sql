-- 이메일 인증 필드 추가 (수동 실행용)
-- H2 콘솔(http://localhost:8080/h2-console)에서 실행하세요

-- 1. 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- 3. 기존 사용자 이메일 인증 완료 처리 (backward compatibility)
UPDATE users
SET email_verified = TRUE,
    email_verified_at = created_at
WHERE email_verified = FALSE;

-- 4. 결과 확인
SELECT id, email, email_verified, verification_token, created_at
FROM users
ORDER BY id;
