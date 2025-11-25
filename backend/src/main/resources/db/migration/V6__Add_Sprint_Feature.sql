-- V6: Add Sprint Feature Support
-- 스프린트 기능 지원을 위한 테이블 생성 및 기존 테이블 수정

-- 1. sprints 테이블 생성
CREATE TABLE sprints (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    goal_text TEXT,
    capacity INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sprints_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT chk_sprint_status CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED'))
);

-- 2. goals 테이블 생성
CREATE TABLE goals (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ON_TRACK',
    progress INTEGER NOT NULL DEFAULT 0,
    metric_type VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_goals_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    CONSTRAINT chk_goal_status CHECK (status IN ('ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'COMPLETED')),
    CONSTRAINT chk_goal_metric_type CHECK (metric_type IN ('MANUAL', 'CARD_COUNT', 'STORY_POINTS')),
    CONSTRAINT chk_goal_progress CHECK (progress >= 0 AND progress <= 100)
);

-- 3. sprint_snapshots 테이블 생성
CREATE TABLE sprint_snapshots (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    snapshot_date DATE NOT NULL,
    total_points INTEGER,
    completed_points INTEGER,
    remaining_points INTEGER,
    status_counts TEXT, -- JSON 형태로 저장
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sprint_snapshots_sprint FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
    CONSTRAINT uq_sprint_snapshot_date UNIQUE (sprint_id, snapshot_date)
);

-- 4. card 테이블에 sprint 관련 컬럼 추가 (모두 nullable)
ALTER TABLE card
ADD COLUMN sprint_id BIGINT,
ADD COLUMN story_points INTEGER,
ADD COLUMN original_card_id BIGINT;

-- 외래 키 제약조건 추가
ALTER TABLE card
ADD CONSTRAINT fk_card_sprint FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_card_original FOREIGN KEY (original_card_id) REFERENCES card(id) ON DELETE SET NULL;

-- 5. boards 테이블에 mode 컬럼 추가 (기본값: KANBAN)
ALTER TABLE boards
ADD COLUMN mode VARCHAR(20) DEFAULT 'KANBAN';

ALTER TABLE boards
ADD CONSTRAINT chk_board_mode CHECK (mode IN ('KANBAN', 'SPRINT'));

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_sprints_board_id ON sprints(board_id);
CREATE INDEX idx_sprints_status ON sprints(status);
CREATE INDEX idx_goals_board_id ON goals(board_id);
CREATE INDEX idx_sprint_snapshots_sprint_id ON sprint_snapshots(sprint_id);
CREATE INDEX idx_sprint_snapshots_date ON sprint_snapshots(snapshot_date);
CREATE INDEX idx_card_sprint_id ON card(sprint_id);
CREATE INDEX idx_card_original_id ON card(original_card_id);

-- 7. 컬럼 코멘트 추가 (문서화)
COMMENT ON TABLE sprints IS '스프린트 정보';
COMMENT ON TABLE goals IS '목표/OKR 정보';
COMMENT ON TABLE sprint_snapshots IS '스프린트 스냅샷 (리포트용)';

COMMENT ON COLUMN sprints.status IS '스프린트 상태: PLANNED(계획됨), ACTIVE(진행중), COMPLETED(완료됨)';
COMMENT ON COLUMN sprints.capacity IS '스프린트 용량 (스토리 포인트 또는 시간)';

COMMENT ON COLUMN goals.progress IS '목표 진행률 (0-100%)';
COMMENT ON COLUMN goals.metric_type IS '지표 유형: MANUAL(수동), CARD_COUNT(카드 개수), STORY_POINTS(스토리 포인트)';

COMMENT ON COLUMN card.sprint_id IS '스프린트 ID (NULL이면 백로그)';
COMMENT ON COLUMN card.story_points IS '스토리 포인트 (용량 계획용)';
COMMENT ON COLUMN card.original_card_id IS '원본 카드 ID (롤오버 시 추적용)';

COMMENT ON COLUMN boards.mode IS '보드 모드: KANBAN(칸반), SPRINT(스프린트)';
