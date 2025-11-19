# Docker 구성 가이드

Kanban Board 애플리케이션을 Docker 컨테이너로 실행하기 위한 가이드입니다.

## 📋 목차

- [사전 요구사항](#사전-요구사항)
- [빠른 시작](#빠른-시작)
- [환경 구성](#환경-구성)
- [사용 시나리오](#사용-시나리오)
- [문제 해결](#문제-해결)
- [상세 설정](#상세-설정)

---

## 사전 요구사항

### 필수 설치 항목
- **Docker Desktop**: 최신 버전 권장
  - [Mac 다운로드](https://www.docker.com/products/docker-desktop/)
  - [Windows 다운로드](https://www.docker.com/products/docker-desktop/)
  - [Linux 설치 가이드](https://docs.docker.com/engine/install/)

### 버전 확인
```bash
docker --version        # Docker version 20.10.0 이상
docker compose version  # Docker Compose version 2.0.0 이상
```

---

## 빠른 시작

### 1. 환경 변수 설정
```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일을 편집하여 실제 값 입력 (선택사항)
# 개발 환경에서는 기본값으로도 실행 가능
```

### 2. Docker 개발 환경 실행 (H2 데이터베이스)
```bash
# 이미지 빌드 및 서비스 시작
docker compose up --build

# 백그라운드 실행
docker compose up -d --build

# 로그 확인
docker compose logs -f

# 특정 서비스 로그만 확인
docker compose logs -f backend
docker compose logs -f frontend
```

### 3. 접속 확인
- **프론트엔드**: http://localhost (포트 80)
- **백엔드 API**: http://localhost:8080/api/v1
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **H2 Console**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:file:/app/data/kanban`
  - Username: `sa`
  - Password: (빈 값)

### 4. 서비스 종료
```bash
# 컨테이너 정지 및 제거
docker compose down

# 볼륨까지 모두 삭제 (데이터 초기화)
docker compose down -v
```

---

## 환경 구성

### 개발 환경 vs 프로덕션 환경

| 항목 | 개발 환경 | 프로덕션 환경 |
|------|----------|-------------|
| **사용 명령** | `docker compose up` | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` |
| **데이터베이스** | H2 (파일 기반) | PostgreSQL 16 |
| **프로파일** | `dev` | `prod` |
| **Swagger UI** | 활성화 | 비활성화 |
| **H2 Console** | 활성화 | 비활성화 |
| **자동 재시작** | 없음 | `unless-stopped` |

---

## 사용 시나리오

### 시나리오 1: 일반 로컬 개발 (가장 빠름)
기존 방식 그대로 사용
```bash
npm run dev
```
**특징**: H2 사용, 핫 리로드, 빠른 재시작

---

### 시나리오 2: Docker 개발 환경 (팀 환경 통일)
컨테이너화된 개발 환경
```bash
# .env 파일 준비
cp .env.example .env

# Docker 컨테이너로 실행
docker compose up --build

# 브라우저 접속
# - 프론트엔드: http://localhost (포트 80)
# - H2 콘솔: http://localhost:8080/h2-console
```
**특징**: H2 사용, 컨테이너화, 팀원 간 환경 통일, CI/CD 파이프라인 테스트용

---

### 시나리오 3: 프로덕션 환경 테스트 (배포 전 검증)
PostgreSQL을 사용한 실제 환경 시뮬레이션
```bash
# .env 파일에서 필수 값 설정
# - DB_PASSWORD (필수)
# - JWT_SECRET (프로덕션용 강력한 값)
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# - MAILERSEND_API_TOKEN, MAILERSEND_FROM_EMAIL

# 프로덕션 환경 실행
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# 브라우저 접속
# - 프론트엔드: http://localhost (포트 80)
# - PostgreSQL: localhost:5432
```
**특징**: PostgreSQL 사용, 실제 프로덕션 환경과 동일, 배포 전 최종 검증

---

## Docker 주요 명령어

### 이미지 및 컨테이너 관리
```bash
# 이미지 목록 확인
docker images

# 실행 중인 컨테이너 확인
docker ps

# 모든 컨테이너 확인 (중지된 것 포함)
docker ps -a

# 특정 컨테이너 로그 확인
docker logs kanban-backend
docker logs kanban-frontend
docker logs kanban-postgres

# 컨테이너 내부 접속
docker exec -it kanban-backend sh
docker exec -it kanban-postgres psql -U kanban_user -d kanban

# 이미지 및 컨테이너 정리
docker compose down --rmi all -v  # 이미지, 볼륨 모두 삭제
```

### 개별 서비스 관리
```bash
# 특정 서비스만 재시작
docker compose restart backend
docker compose restart frontend

# 특정 서비스만 빌드
docker compose build backend
docker compose build frontend

# 특정 서비스만 시작
docker compose up backend
docker compose up frontend
```

---

## 문제 해결

### 1. 포트 충돌 오류
```
Error: Bind for 0.0.0.0:8080 failed: port is already allocated
```

**해결 방법**:
```bash
# 포트를 사용 중인 프로세스 확인
lsof -i :8080
lsof -i :80

# 기존 로컬 개발 서버 종료
npm run stop  # 또는 Ctrl+C

# Docker 컨테이너 재시작
docker compose down
docker compose up
```

---

### 2. 빌드 실패 - Gradle 오류
```
ERROR: Could not build wheels for xxx
```

**해결 방법**:
```bash
# Docker 빌드 캐시 삭제
docker compose build --no-cache backend

# Gradle 캐시 문제 시 로컬에서 빌드 확인
cd backend
./gradlew clean build
```

---

### 3. 빌드 실패 - npm 오류
```
ERROR: npm install failed
```

**해결 방법**:
```bash
# Docker 빌드 캐시 삭제
docker compose build --no-cache frontend

# npm 캐시 문제 시 로컬에서 빌드 확인
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### 4. PostgreSQL 연결 실패 (프로덕션 환경)
```
FATAL: password authentication failed for user "kanban_user"
```

**해결 방법**:
```bash
# .env 파일에서 DB_PASSWORD 확인
cat .env | grep DB_PASSWORD

# PostgreSQL 컨테이너 재생성
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

---

### 5. H2 데이터베이스 파일 권한 오류
```
ERROR: Could not create database file
```

**해결 방법**:
```bash
# backend/data 디렉토리 생성 및 권한 설정
mkdir -p backend/data
chmod 755 backend/data

# 컨테이너 재시작
docker compose restart backend
```

---

### 6. 볼륨 데이터 초기화
개발 중 데이터베이스를 완전히 초기화하고 싶을 때
```bash
# 모든 볼륨 삭제 (H2 데이터, PostgreSQL 데이터, 업로드 파일)
docker compose down -v

# 특정 볼륨만 삭제
docker volume rm kanban-master_postgres_data
docker volume rm kanban-master_upload_data

# 볼륨 목록 확인
docker volume ls
```

---

## 상세 설정

### 생성된 Docker 파일 구조
```
kanban-master/
├── docker-compose.yml              # 개발 환경 (H2)
├── docker-compose.prod.yml         # 프로덕션 환경 (PostgreSQL)
├── .env.example                    # 환경 변수 템플릿
├── .env                            # 실제 환경 변수 (git ignored)
├── backend/
│   ├── Dockerfile                  # 백엔드 이미지 빌드 설정
│   └── .dockerignore               # 빌드 제외 파일
└── frontend/
    ├── Dockerfile                  # 프론트엔드 이미지 빌드 설정
    ├── nginx.conf                  # Nginx 웹서버 설정
    └── .dockerignore               # 빌드 제외 파일
```

### Docker Compose 서비스 구성

#### 개발 환경 (`docker-compose.yml`)
- **backend**: Spring Boot 애플리케이션 (포트 8080)
  - H2 파일 데이터베이스 사용
  - `./backend/data` 디렉토리 마운트 (데이터 영속화)
  - 파일 업로드용 볼륨 마운트

- **frontend**: React 애플리케이션 + Nginx (포트 80)
  - Vite 빌드 결과물 정적 서빙
  - `/api/`와 `/uploads/` 경로를 백엔드로 프록시

#### 프로덕션 환경 (`docker-compose.prod.yml`)
추가 서비스:
- **postgres**: PostgreSQL 16 데이터베이스 (포트 5432)
  - 데이터 볼륨 마운트 (데이터 영속화)
  - Health check 설정

변경 사항:
- 백엔드 프로파일: `dev` → `prod`
- H2 볼륨 마운트 제거
- PostgreSQL 연결 설정 추가
- 자동 재시작 정책 추가 (`unless-stopped`)

### 환경 변수 설정 (.env)

#### 필수 환경 변수 (프로덕션)
```env
# JWT 시크릿 (최소 32자)
JWT_SECRET=your_strong_production_secret_minimum_32_chars

# PostgreSQL 데이터베이스 비밀번호
DB_PASSWORD=your_secure_database_password

# Google OAuth (선택)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 이메일 서비스 (선택)
MAILERSEND_API_TOKEN=your_mailersend_token
MAILERSEND_FROM_EMAIL=noreply@yourdomain.com
```

#### 선택 환경 변수
```env
# 프론트엔드 URL (CORS 설정)
FRONTEND_URL=http://localhost

# 쿠키 도메인
COOKIE_DOMAIN=localhost
```

---

## 성능 최적화

### Multi-stage Build
Docker 이미지 크기 최적화를 위해 Multi-stage build 사용:
- **Backend**: Gradle 빌드 → 경량 JRE 이미지로 복사
- **Frontend**: npm 빌드 → Nginx Alpine 이미지로 복사

### 빌드 캐시 활용
```bash
# 캐시 활용하여 빠른 빌드
docker compose build

# 캐시 무시하고 새로 빌드
docker compose build --no-cache
```

### 이미지 크기 확인
```bash
docker images | grep kanban
```

---

## 보안 주의사항

### ⚠️ 절대 커밋하지 말 것
- `.env` 파일 (실제 비밀 정보 포함)
- `backend/data/` (H2 데이터베이스 파일)

### ✅ 프로덕션 배포 시 체크리스트
- [ ] `.env` 파일에 강력한 JWT_SECRET 설정 (최소 32자)
- [ ] DB_PASSWORD 복잡도 충족 (대소문자, 숫자, 특수문자)
- [ ] FRONTEND_URL을 실제 도메인으로 변경
- [ ] COOKIE_DOMAIN을 실제 도메인으로 변경
- [ ] Google OAuth 실제 클라이언트 ID/Secret 설정
- [ ] MailerSend 실제 API 토큰 및 발신 이메일 설정
- [ ] PostgreSQL 데이터 볼륨 백업 정책 수립

---

## 추가 리소스

### 관련 문서
- [CLAUDE.md](./CLAUDE.md) - 프로젝트 전체 개발 가이드
- [backend/CLAUDE.md](./backend/CLAUDE.md) - 백엔드 기술 스택 가이드
- [frontend/CLAUDE.md](./frontend/CLAUDE.md) - 프론트엔드 기술 스택 가이드

### Docker 공식 문서
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Dockerfile 참조](https://docs.docker.com/engine/reference/builder/)
- [Docker 네트워크](https://docs.docker.com/network/)
- [Docker 볼륨](https://docs.docker.com/storage/volumes/)

---

## 문의 및 기여

문제가 발생하거나 개선 사항이 있으면 이슈를 생성해주세요.
