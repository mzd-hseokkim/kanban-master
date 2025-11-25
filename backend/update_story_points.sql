-- 기존 카드 데이터에 Priority 기반 StoryPoints 자동 설정
-- HIGH -> 5, MEDIUM -> 3, LOW -> 1, null -> 1

-- 1. HIGH priority 카드들에 5 포인트 할당
UPDATE card
SET story_points = 5
WHERE priority = 'HIGH' AND story_points IS NULL;

-- 2. MEDIUM priority 카드들에 3 포인트 할당
UPDATE card
SET story_points = 3
WHERE priority = 'MEDIUM' AND story_points IS NULL;

-- 3. LOW priority 카드들에 1 포인트 할당
UPDATE card
SET story_points = 1
WHERE priority = 'LOW' AND story_points IS NULL;

-- 4. priority가 null인 카드들에 1 포인트 할당
UPDATE card
SET story_points = 1
WHERE priority IS NULL AND story_points IS NULL;

-- 검증 쿼리: 업데이트 결과 확인
SELECT
    priority,
    COUNT(*) as card_count,
    MIN(story_points) as min_points,
    MAX(story_points) as max_points,
    SUM(story_points) as total_points
FROM card
GROUP BY priority
ORDER BY
    CASE priority
        WHEN 'HIGH' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'LOW' THEN 3
        ELSE 4
    END;

-- 스프린트별 포인트 확인
SELECT
    s.id AS sprint_id,
    s.name AS sprint_name,
    COUNT(c.id) AS total_cards,
    COUNT(CASE WHEN c.is_completed = true THEN 1 END) AS completed_cards,
    SUM(c.story_points) AS total_points,
    SUM(CASE WHEN c.is_completed = true THEN c.story_points ELSE 0 END) AS completed_points
FROM sprints s
LEFT JOIN card c ON c.sprint_id = s.id
WHERE s.status = 'ACTIVE'
GROUP BY s.id, s.name;
