-- Activity 테이블 생성
CREATE TABLE activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    scope_type VARCHAR(20) NOT NULL,
    scope_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    actor_id BIGINT NOT NULL,
    message VARCHAR(500) NOT NULL,
    payload CLOB,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_activities_scope ON activities (scope_type, scope_id);
CREATE INDEX idx_activities_actor ON activities (actor_id);
CREATE INDEX idx_activities_created_at ON activities (created_at);
CREATE INDEX idx_activities_event_type ON activities (event_type);
