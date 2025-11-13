# TRACE Evaluation Framework - Reference Guide

This document provides additional context for the automated analysis scripts.
The scripts perform the actual evaluation - this guide explains the methodology.

## TRACE Principles

**T**raceability - Every requirement must map to code  
**R**obustness - Error handling and edge cases covered  
**A**dherence - Coding standards and patterns followed  
**C**ompleteness - All requirements implemented  
**E**fficiency - Performance targets achieved

## Automated vs Manual Checks

### Automated (via scripts)
- ✅ Requirements mapping (analyze_traceability.py)
- ✅ API endpoint verification (check_api_compliance.py)
- ✅ Code structure analysis (measure_code_quality.py)
- ✅ Pattern detection (dependency injection, error handling)

### Manual (human verification required)
- Functional testing (features actually work)
- Performance testing (response times, load)
- Security testing (penetration, vulnerability scanning)
- User experience validation

## Evaluation Criteria Details

### Traceability Scoring

```
Score = (Must_Complete / Must_Total) * 70% + (Overall_Complete / Overall_Total) * 30%

Pass: 100% Must requirements
Partial: 80-99% implementation
Fail: <80% Must requirements
```

**The scripts check**:
- Requirement ID mentions in code
- Backend implementation (controllers, services, repositories)
- Frontend implementation (components, API calls)
- Test coverage
- Git commit references

### API Compliance Scoring

```
Score = (Implemented / Total) * 100 - (Critical * 15) - (Major * 5)

Pass: 90%+ compliance
Partial: 70-89% compliance
Fail: <70% compliance
```

**The scripts check**:
- Endpoint path accuracy (exact match required)
- HTTP method correctness
- Annotation presence (@PostMapping, etc.)
- Implementation location (file:line)

**Manual verification needed for**:
- Request/response schema validation
- HTTP status codes (requires runtime testing)
- Error responses (requires negative testing)

### Code Quality Scoring

```
Score = 100 - (Critical * 10) - (Major * 5) - (Minor * 2) + Bonuses

Excellent: 90-100
Good: 70-89
Fair: 50-69
Poor: <50
```

**Deductions**:
- Field injection: -2 per occurrence
- Business logic in controller: -5
- Entity exposed in API: -5
- Missing tests: -5 per untested service
- Generic exception catching: -2

**Bonuses**:
- Global exception handler: +5
- High DTO usage (>80%): +5
- Constructor injection: +5

### Functional Verification

**Cannot be automated** - requires manual testing:

**Critical tests**:
1. Application starts without errors
2. Health check endpoint responds
3. Authentication flow works
4. Core CRUD operations succeed
5. Error cases return appropriate responses

**Performance tests**:
- API response times <200ms (p95)
- Page load times <3s (3G)
- No N+1 queries in logs
- Memory usage stable

## Common Issues and Patterns

### Traceability Issues

**Issue**: Requirements not found in code
- **Cause**: No comments or docs linking code to requirements
- **Fix**: Add requirement IDs in JavaDoc/comments
- **Example**: 
  ```java
  /**
   * Create a new board (FR-01)
   */
  public Board createBoard(CreateBoardRequest request) { ... }
  ```

**Issue**: Partial implementation detected
- **Cause**: Backend exists but frontend missing (or vice versa)
- **Fix**: Complete missing layer
- **Script output**: Will show which files are found/missing

### API Compliance Issues

**Issue**: Path mismatch (spec: /api/v1/boards, code: /boards)
- **Cause**: Inconsistent base path configuration
- **Fix**: Add base path in controller or configuration
- **Example**:
  ```java
  @RequestMapping("/api/v1")
  @RestController
  public class BoardController { ... }
  ```

**Issue**: Wrong HTTP method
- **Cause**: Using @GetMapping for mutations
- **Fix**: Use correct annotation for operation
- **Guideline**: POST=create, PUT=full update, PATCH=partial, DELETE=remove

### Code Quality Issues

**Issue**: Field injection detected
- **Bad**:
  ```java
  @Autowired
  private BoardService boardService;
  ```
- **Good**:
  ```java
  @RequiredArgsConstructor
  public class BoardController {
      private final BoardService boardService;
  }
  ```

**Issue**: Entity returned directly
- **Bad**:
  ```java
  public ResponseEntity<Board> getBoard() { ... }
  ```
- **Good**:
  ```java
  public ResponseEntity<BoardResponse> getBoard() {
      Board board = service.getBoard();
      return ResponseEntity.ok(BoardResponse.from(board));
  }
  ```

**Issue**: Business logic in controller
- **Bad**:
  ```java
  @PostMapping
  public ResponseEntity<Board> create(@RequestBody CreateRequest req) {
      Board board = new Board();
      board.setName(req.getName());
      if (req.getName().length() > 255) throw ...
      boardRepository.save(board);
      return ResponseEntity.ok(board);
  }
  ```
- **Good**:
  ```java
  @PostMapping
  public ResponseEntity<BoardResponse> create(@RequestBody CreateRequest req) {
      BoardResponse response = boardService.createBoard(req);
      return ResponseEntity.status(201).body(response);
  }
  ```

## Script Output Interpretation

### analyze_traceability.py

**Output example**:
```
FR-01: Board Creation
  ✅ Status: complete
  📁 Backend: 3 files (BoardController.java, BoardService.java, BoardRepository.java)
  🎨 Frontend: 2 files (BoardForm.tsx, useBoardService.ts)
  🧪 Tests: 2 files (BoardServiceTest.java, BoardControllerTest.java)
  📝 Commits: 5
```

**Interpretation**:
- ✅ = All components found
- ⚠️ = Some components missing (check which layer)
- ❌ = No implementation found

### check_api_compliance.py

**Output example**:
```
📋 Checking: POST /api/v1/boards
  ✅ Found: src/main/java/BoardController.java:45

📋 Checking: PUT /api/v1/boards/{id}
  ⚠️  Path mismatch: expected /api/v1/boards/{id}, found /boards/{id}
```

**Action items**:
- ✅ = No action needed
- ⚠️ = Fix path/method mismatch
- ❌ = Implement missing endpoint

### measure_code_quality.py

**Output example**:
```
Controllers: 5
Services: 5
Repositories: 5
DTO Usage: 85.0%

Field injection: 0
Constructor injection: 15
@Transactional usage: 12

⚠️ Issues:
- BoardController.java:23: Business logic in controller
- UserService.java:45: Generic Exception caught
```

**Action items**:
- Address issues listed with file:line
- Refactor anti-patterns
- Add missing tests

## Integration Examples

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running Vibe Code evaluation..."
python3 scripts/measure_code_quality.py .

if [ $? -ne 0 ]; then
    echo "Quality check failed. Commit aborted."
    exit 1
fi
```

### GitHub Actions

```yaml
name: Quality Gate
on: [pull_request]
jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Evaluation
        run: |
          python3 scripts/generate_report.py .
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: evaluation-report
          path: evaluation_report.md
```

### GitLab CI

```yaml
quality_check:
  script:
    - python3 scripts/generate_report.py .
  artifacts:
    paths:
      - evaluation_report.md
      - "*_report.md"
    expire_in: 30 days
```

## Thresholds and Targets

### Recommended Minimum Scores

For production deployment:
- Traceability: ≥90 (all Must requirements)
- API Compliance: ≥85 (critical endpoints correct)
- Code Quality: ≥70 (acceptable architecture)
- Functional: ≥90 (core features work)
- **Overall: ≥75**

For MVP/Beta:
- Traceability: ≥80
- API Compliance: ≥70
- Code Quality: ≥60
- Functional: ≥80
- **Overall: ≥70**

### Quality Gates

**Block deployment if**:
- Any Must requirement missing
- Critical API endpoints not implemented
- Code quality <50 (major architectural issues)
- Security vulnerabilities detected (manual check)

**Warn but allow if**:
- Should requirements partially missing
- Minor API mismatches
- Code quality 50-70 (with improvement plan)

## Continuous Improvement

### Weekly Quality Tracking

```bash
# Run and tag
python3 scripts/generate_report.py . --output reports/week-$(date +%W).md

# Track metrics over time
grep "Overall Score" reports/*.md
```

### Quality Metrics Dashboard

Extract scores and visualize:
```bash
# Extract scores to CSV
for report in reports/*.md; do
    grep -A5 "Overall Score" $report | grep -E "Traceability|Compliance|Quality" >> metrics.csv
done

# Import to spreadsheet or Grafana
```

### Refactoring Priorities

1. Fix Critical issues (block deployment)
2. Complete Must requirements
3. Fix Major issues (impact production)
4. Improve test coverage to 80%
5. Address Minor issues (code smell)
6. Implement Could requirements

## Further Reading

- Clean Code by Robert C. Martin - Coding standards
- Building Microservices by Sam Newman - Architecture patterns
- Domain-Driven Design by Eric Evans - Domain modeling
- Test-Driven Development by Kent Beck - Testing practices
