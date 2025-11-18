-- V5: Add email verification fields to users table

-- Add email verification columns
ALTER TABLE users
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN verification_token VARCHAR(255),
ADD COLUMN verification_token_expiry TIMESTAMP,
ADD COLUMN email_verified_at TIMESTAMP;

-- Create index on verification_token for faster lookups
CREATE INDEX idx_users_verification_token ON users(verification_token);

-- Update existing users to be verified (backward compatibility)
UPDATE users SET email_verified = TRUE, email_verified_at = created_at WHERE email_verified = FALSE;

-- Add comment for documentation
COMMENT ON COLUMN users.email_verified IS '이메일 인증 완료 여부';
COMMENT ON COLUMN users.verification_token IS '이메일 인증 토큰 (UUID)';
COMMENT ON COLUMN users.verification_token_expiry IS '인증 토큰 만료 시간';
COMMENT ON COLUMN users.email_verified_at IS '이메일 인증 완료 시각';
