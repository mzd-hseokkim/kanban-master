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
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_api_tokens_owner_user FOREIGN KEY (owner_user_id) REFERENCES users(id),
    CONSTRAINT fk_api_tokens_board FOREIGN KEY (board_id) REFERENCES boards(id)
);

CREATE UNIQUE INDEX ux_api_tokens_token_hash ON api_tokens (token_hash);
CREATE INDEX ix_api_tokens_owner_user_id ON api_tokens (owner_user_id);
CREATE INDEX ix_api_tokens_board_id ON api_tokens (board_id);
CREATE INDEX ix_api_tokens_expires_at ON api_tokens (expires_at);
