# Kanban Board – Monorepo Guidance

## Purpose
Lightweight reference for how the Spring Boot backend and React frontend coexist inside this monorepo.

## Architecture & Communication
- Backend (Java 17, Spring Boot 3.2, Gradle) and frontend (React 19, Vite, Tailwind) live in separate folders but share the root package.json for orchestration.
- Backend REST endpoints always sit under the /api prefix; the frontend dev server proxies those calls and backend CORS allows the frontend origin.
- Each project must stay deployable on its own even though scripts are shared.

## Development Workflow
- Use the root npm scripts to install dependencies, run dev servers together or individually, build artifacts, and clean outputs.
- Run both services concurrently during local work; backend listens on 8080, frontend on 3000, and both support hot reload.
- Backend compiles to a runnable JAR; frontend compiles to static assets served by any CDN or web host.

## Quality & Documentation
- Follow backend/CLAUDE.md and frontend/CLAUDE.md for technology-specific rules while enforcing at least 80% automated test coverage and passing linters before commits.
- Keep README, API references, and CHANGELOG accurate; reserve code comments for non-obvious logic.

## Environment Expectations
- Backend: H2 for development, PostgreSQL for production, and Spring profiles (dev, test, prod) to separate configs.
- Frontend: Vite dev server on port 3000, settings overridden through .env.local, API base URL routed through the proxy during development.

## Git & Collaboration
- Branch model: main for releases, develop for integration, feature/* and fix/* for focused work.
- Use conventional commits, keep changes atomic, require reviews with tests and lint checks executed beforehand, and update documentation when behavior changes.

## Security Guidelines
- Backend validates inputs, relies on parameterized persistence to avoid SQL injection, enforces CSRF, and protects endpoints with authentication and authorization.
- Frontend prevents XSS through React defaults, secures API calls, keeps secrets out of shipped bundles, and uses environment variables for configuration.

## Performance Targets
- Backend CRUD operations should complete in under 200 ms with tuned queries, appropriate indexing, and connection pooling.
- Frontend aims for sub-3-second initial load on 3G, sub-500 KB initial bundle size, strategic code splitting, and optimized media assets.

## Testing Strategy
- Backend includes unit coverage for business logic, integration coverage for REST APIs, and database tests powered by containers.
- Frontend includes component unit tests, integration tests for key flows, and end-to-end tests for critical journeys.

## Deployment Expectations
- Backend builds via Gradle and produces a JAR executed with Java; deployments package only the built artifact.
- Frontend builds via npm and outputs the dist directory for uploading to static hosting or CDNs.

## Troubleshooting Reminders
- Resolve port conflicts on 3000 or 8080 before running dev servers.
- Clear and reinstall dependencies when builds fail; ensure Java 17+ and Node 18+ are installed.
- Fix CORS or proxy misconfigurations whenever API calls fail between the two projects.

## Specification Standards
- docs/specs files describe what the system must do without containing executable snippets.
- Allowed content: markdown tables, property definitions, ER diagrams, plain-text interface descriptions, endpoint formats, business rules, architectural rationale, and implementation roadmaps.
- Disallowed content: Java/Kotlin/TypeScript implementations, annotations, SQL statements, configuration files, or any runnable code.
- Covered files include README, architecture, data-model, api-spec, frontend-design, and implementation-roadmap within docs/specs/Priority-1.

## Best Practices
- Apply DRY, SOLID, component composition, and separation of concerns across both codebases.
- Keep error handling and structured logging consistent, externalize configuration, and ensure specifications stay abstract while implementation details live in code.
