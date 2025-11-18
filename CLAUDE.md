# Kanban Board – Monorepo Guidance

## Notice

Always answer in Korean language unless user asked to answer in English.

## Purpose

Lightweight reference for how the Spring Boot backend and React frontend coexist inside this monorepo.

## Architecture & Communication

-   Backend (Java 17, Spring Boot 3.2, Gradle) and frontend (React 19, Vite, Tailwind) live in separate folders but share the root package.json for orchestration.
-   Backend REST endpoints always sit under the /api prefix; the frontend dev server proxies those calls and backend CORS allows the frontend origin.
-   Each project must stay deployable on its own even though scripts are shared.

## Development Workflow

-   Use the root npm scripts to install dependencies, run dev servers together or individually, build artifacts, and clean outputs.
-   Run both services concurrently during local work; backend listens on 8080, frontend on 3000, and both support hot reload.
-   Backend compiles to a runnable JAR; frontend compiles to static assets served by any CDN or web host.

## Quality & Documentation

-   Follow backend/CLAUDE.md and frontend/CLAUDE.md for technology-specific rules while enforcing at least 80% automated test coverage and passing linters before commits.
-   Keep README, API references, and CHANGELOG accurate; reserve code comments for non-obvious logic.

## Environment Expectations

-   Backend: H2 for development, PostgreSQL for production, and Spring profiles (dev, test, prod) to separate configs.
-   Frontend: Vite dev server on port 3000, settings overridden through .env.local, API base URL routed through the proxy during development.

## Git & Collaboration

-   Branch model: main for releases, develop for integration, feature/_ and fix/_ for focused work.
-   Use conventional commits, keep changes atomic, require reviews with tests and lint checks executed beforehand, and update documentation when behavior changes.
-   GitHub 관련 요청이 있을 때는 GitHub CLI(`gh`)를 사용해 작업을 수행할 것.

## Security Guidelines

-   Backend validates inputs, relies on parameterized persistence to avoid SQL injection, enforces CSRF, and protects endpoints with authentication and authorization.
-   Frontend prevents XSS through React defaults, secures API calls, keeps secrets out of shipped bundles, and uses environment variables for configuration.

## Performance Targets

-   Backend CRUD operations should complete in under 200 ms with tuned queries, appropriate indexing, and connection pooling.
-   Frontend aims for sub-3-second initial load on 3G, sub-500 KB initial bundle size, strategic code splitting, and optimized media assets.

## Testing Strategy

-   Backend includes unit coverage for business logic, integration coverage for REST APIs, and database tests powered by containers.
-   Frontend includes component unit tests, integration tests for key flows, and end-to-end tests for critical journeys.

## Deployment Expectations

-   Backend builds via Gradle and produces a JAR executed with Java; deployments package only the built artifact.
-   Frontend builds via npm and outputs the dist directory for uploading to static hosting or CDNs.

## Troubleshooting Reminders

-   Resolve port conflicts on 3000 or 8080 before running dev servers.
-   Clear and reinstall dependencies when builds fail; ensure Java 17+ and Node 18+ are installed.
-   Fix CORS or proxy misconfigurations whenever API calls fail between the two projects.

## Specification Standards

-   docs/specs files describe what the system must do without containing executable snippets.
-   Allowed content: markdown tables, property definitions, ER diagrams, plain-text interface descriptions, endpoint formats, business rules, architectural rationale, and implementation roadmaps.
-   Disallowed content: Java/Kotlin/TypeScript implementations, annotations, SQL statements, configuration files, or any runnable code.
-   Covered files include README, architecture, data-model, api-spec, frontend-design, and implementation-roadmap within docs/specs/Priority-1.

## Code Quality & Static Analysis

### SonarQube Integration

-   **정적 분석 도구**: SonarQube를 사용하여 코드 품질, 보안 취약점, 코드 스멜, 기술 부채를 자동으로 분석
-   **중요**: SonarQube는 정적 분석(Static Analysis)만 수행하며, 런타임 동작이나 성능 테스트 같은 동적 분석(Dynamic Analysis)은 포함하지 않음

### 실행 방법

**백엔드 정적 분석**:
```bash
./sonar-backend.sh
```
-   Gradle 플러그인을 통해 Java 코드, 테스트 커버리지, 코드 복잡도 등을 분석
-   프로젝트 키: `kanban-master-backend`

**프론트엔드 정적 분석**:
```bash
./sonar-frontend.sh
```
-   sonar-scanner를 통해 TypeScript/React 코드, ESLint 규칙 준수, 테스트 커버리지 등을 분석
-   프로젝트 키: `kanban-master-frontend`

### SonarQube Web API 활용

-   **API 토큰**: `squ_477df39c0bc1eb56d4becc251bcd7260d4de4125`
-   **인증 방법**: `curl -u squ_477df39c0bc1eb56d4becc251bcd7260d4de4125: http://localhost:9000/api/...`
-   **주요 용도**: 분석 결과 조회, 이슈 목록 가져오기, 품질 게이트 상태 확인

### 코드 리뷰 검증 프로세스

사용자가 코드 리뷰 검증을 요청하면:
1.  SonarQube 정적 분석 실행 (sonar-backend.sh 또는 sonar-frontend.sh)
2.  Web API를 통해 분석 결과 데이터 수집
3.  발견된 이슈, 코드 스멜, 보안 취약점, 중복 코드 등을 종합하여 리포트 제공
4.  우선순위가 높은 문제부터 개선 권장사항 제시

**제한사항**: 정적 분석은 코드 구조와 패턴만 검사하며, 실제 런타임 동작, 성능, 메모리 사용량 등은 별도의 동적 분석이나 프로파일링 도구가 필요

## Best Practices

-   Apply DRY, SOLID, component composition, and separation of concerns across both codebases.
-   Keep error handling and structured logging consistent, externalize configuration, and ensure specifications stay abstract while implementation details live in code.
