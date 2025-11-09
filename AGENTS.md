# Kanban Board - Monorepo Development Standards

## Project Overview

Kanban board application built as a monorepo with Spring Boot backend and React frontend.

## Architecture

### Monorepo Structure
```
kanban-master/
├── backend/          # Java 17 + Spring Boot 3.2 + Gradle
├── frontend/         # React 19 + Vite + Tailwind
├── package.json      # Workspace configuration
└── CLAUDE.md         # This file
```

## Development Principles

### 1. Monorepo Management
- **Workspace Organization**: Keep backend and frontend as separate, loosely coupled projects
- **Shared Scripts**: Use root package.json for common commands (dev, build, clean)
- **Independent Deployability**: Each project should be deployable independently
- **Version Consistency**: Maintain consistent versioning across the monorepo

### 2. Communication Standards
- **API Contract**: Backend exposes REST API, frontend consumes it
- **API Prefix**: All backend APIs use `/api` prefix
- **Proxy Configuration**: Frontend proxies `/api` requests to backend during development
- **CORS**: Backend configured to accept requests from frontend origin

### 3. Development Workflow
- **Local Development**: Run both projects concurrently with `npm run dev`
- **Port Allocation**: Backend (8080), Frontend (3000)
- **Hot Reload**: Both projects support hot reloading during development
- **Build Process**: Backend builds to JAR, Frontend builds to static files

### 4. Code Quality Standards
- **Backend**: See `backend/CLAUDE.md` for Java/Spring standards
- **Frontend**: See `frontend/CLAUDE.md` for React/TypeScript standards
- **Testing**: Both projects maintain ≥80% code coverage
- **Linting**: Enforce linting rules before commits

### 5. Documentation Standards
- **README**: Keep README.md updated with setup and development instructions
- **API Docs**: Document all REST endpoints with examples
- **Code Comments**: Write self-documenting code, use comments for complex logic only
- **Changelog**: Maintain CHANGELOG.md for significant changes

## Common Commands

### Development
```bash
# Install all dependencies
npm run install:frontend
npm run install:backend

# Run both projects
npm run dev

# Run individually
npm run dev:backend
npm run dev:frontend
```

### Build
```bash
# Build both projects
npm run build

# Build individually
npm run build:backend
npm run build:frontend
```

### Maintenance
```bash
# Clean all build artifacts
npm run clean
```

## Environment Configuration

### Backend Environment
- **Database**: H2 in-memory (development), PostgreSQL (production)
- **Port**: 8080
- **Profile**: Use Spring profiles (dev, test, prod)

### Frontend Environment
- **Development Server**: Vite dev server on port 3000
- **Environment Variables**: Use `.env.local` for local overrides
- **API Base URL**: Proxied to backend during development

## Git Workflow

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Individual feature branches
- **fix/***: Bug fix branches

### Commit Standards
- Use conventional commits (feat, fix, docs, style, refactor, test, chore)
- Write clear, descriptive commit messages
- Keep commits atomic and focused

### Code Review
- All changes require code review before merging
- Run tests and linting before creating PR
- Update relevant documentation with code changes

## Security Guidelines

### Backend Security
- Input validation on all endpoints
- SQL injection prevention (use JPA/Hibernate properly)
- CSRF protection enabled
- Authentication/Authorization as needed

### Frontend Security
- XSS prevention (React escapes by default)
- Secure API communication
- No sensitive data in client-side code
- Environment variables for configuration

## Performance Standards

### Backend
- API response time: <200ms for CRUD operations
- Database query optimization
- Proper indexing strategy
- Connection pooling

### Frontend
- Initial load: <3s on 3G
- Bundle size: <500KB initial
- Code splitting for routes
- Image optimization

## Testing Strategy

### Backend Testing
- Unit tests for business logic
- Integration tests for API endpoints
- Database tests with test containers

### Frontend Testing
- Component unit tests
- Integration tests for user flows
- E2E tests for critical paths

## Deployment

### Backend Deployment
- Build: `./gradlew build`
- Output: `build/libs/*.jar`
- Run: `java -jar app.jar`

### Frontend Deployment
- Build: `npm run build`
- Output: `dist/`
- Deploy: Static files to CDN/web server

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 3000 or 8080 are in use
2. **Dependency issues**: Run clean commands and reinstall
3. **CORS errors**: Verify proxy configuration in vite.config.ts
4. **Build failures**: Check Java 21 and Node 18+ are installed

### Debug Commands
```bash
# Check Java version
java -version

# Check Node version
node -version

# Gradle dependencies
cd backend && ./gradlew dependencies

# NPM dependencies
cd frontend && npm list
```

## Specification Document Standards

### Purpose
Specification documents (`docs/specs/`) define WHAT the system does (규격서 - contract/specification), NOT HOW it's implemented.

### Rules for Specification Documents
1. **NO SOURCE CODE**: Specification files must NOT contain executable code
   - ❌ Do NOT include Java/Kotlin classes, methods, or annotations
   - ❌ Do NOT include SQL DDL/DML statements
   - ❌ Do NOT include TypeScript/JavaScript implementations
   - ❌ Do NOT include configuration code

2. **ALLOWED CONTENT**: Specification files should contain
   - ✅ Table structure definitions (as plain text tables, not SQL)
   - ✅ Property/field specifications (as table rows)
   - ✅ Entity relationship diagrams (ER diagrams)
   - ✅ Interface definitions (as plain text structure, not code)
   - ✅ API endpoint definitions (format and parameters, not implementation)
   - ✅ Business rules and constraints (as descriptions)
   - ✅ Architecture patterns and concepts
   - ✅ Design rationale and decision explanations

3. **FORMAT EXAMPLES**:
   - Table format: Use markdown tables for table structures
   - Descriptions: Use plain text, bullet points, and numbered lists
   - Diagrams: Use ASCII art or plaintext structure diagrams
   - Migration process: Describe steps in plain text, NOT SQL code

4. **ANTI-PATTERNS**:
   - DO NOT show implementation examples in specs
   - DO NOT include @Entity, @Table, @Column annotations
   - DO NOT include CREATE TABLE, ALTER TABLE, INSERT, UPDATE statements
   - DO NOT include Spring configuration or properties
   - DO NOT include function/method implementations

### Specification Files
- `docs/specs/Priority-1/README.md` - Overview and navigation
- `docs/specs/Priority-1/architecture.md` - System architecture (no code)
- `docs/specs/Priority-1/data-model.md` - Data structure definitions (no code)
- `docs/specs/Priority-1/api-spec.md` - REST API specification (format only, not implementation)
- `docs/specs/Priority-1/frontend-design.md` - UI/Component specifications (no code)
- `docs/specs/Priority-1/implementation-roadmap.md` - Implementation timeline and tasks

## Best Practices

1. **DRY Principle**: Don't repeat yourself across projects
2. **SOLID Principles**: Follow in backend code
3. **Component Composition**: Use in frontend
4. **Separation of Concerns**: Clear boundaries between layers
5. **Error Handling**: Consistent error handling patterns
6. **Logging**: Structured logging at appropriate levels
7. **Configuration**: Externalize all configuration
8. **Documentation**: Keep documentation close to code
9. **Specs vs Code**: Keep specifications abstract (WHAT), implementation concrete (HOW)
