-- BoardMember 테이블 생성 (권한 및 초대 관리)
CREATE TABLE board_members (
    board_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EDITOR',
    invitation_status VARCHAR(20) NOT NULL DEFAULT 'ACCEPTED',
    invitation_token VARCHAR(64),
    invited_at DATETIME,
    accepted_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (board_id, user_id)
);

-- 인덱스 생성
CREATE INDEX idx_board_members_board_id ON board_members (board_id);
CREATE INDEX idx_board_members_user_id ON board_members (user_id);
CREATE UNIQUE INDEX idx_board_members_invitation_token ON board_members (invitation_token);
CREATE INDEX idx_board_members_invitation_status ON board_members (invitation_status);
