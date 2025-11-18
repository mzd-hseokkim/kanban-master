#!/bin/bash

SONAR_HOST="http://localhost:9000"
SONAR_TOKEN="sqp_1d338bbddaf5e05a5782da6b3f4f5118cbf129b6"
PROJECT_KEY="kanban-master-backend"

echo "SonarQube 백엔드 프로젝트 분석 결과 수집 중..."

# 프로젝트 메트릭 조회
METRICS="bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc,sqale_index,reliability_rating,security_rating,sqale_rating"

MEASURES=$(curl -s -u "${SONAR_TOKEN}:" \
  "${SONAR_HOST}/api/measures/component?component=${PROJECT_KEY}&metricKeys=${METRICS}")

# Issue 조회 (최대 500개)
ISSUES=$(curl -s -u "${SONAR_TOKEN}:" \
  "${SONAR_HOST}/api/issues/search?componentKeys=${PROJECT_KEY}&ps=500&resolved=false")

# Hotspot 조회
HOTSPOTS=$(curl -s -u "${SONAR_TOKEN}:" \
  "${SONAR_HOST}/api/hotspots/search?projectKey=${PROJECT_KEY}&ps=500")

# 결과를 JSON 파일로 저장
cat > backend-review.json << EOJSON
{
  "project": "${PROJECT_KEY}",
  "analysisDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "sonarQubeUrl": "${SONAR_HOST}",
  "measures": ${MEASURES},
  "issues": ${ISSUES},
  "hotspots": ${HOTSPOTS}
}
EOJSON

echo "✅ backend-review.json 파일이 생성되었습니다."
