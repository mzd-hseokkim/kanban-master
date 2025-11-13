---
name: evaluate-vibe-codes
description: Automated evaluation framework for Vibe Coding outputs using TRACE methodology (Traceability, Robustness, Adherence, Completeness, Efficiency). Use when requirements.md, spec.md, and repository code are available for evaluation, or when code quality assessment, requirements traceability, API compliance checking, or comprehensive Vibe Coding evaluation is requested. Includes Python scripts for automated analysis of requirements mapping, API compliance, code quality metrics, and report generation.
---

# Evaluate Vibe Codes

Automated evaluation framework for Vibe Coding results using TRACE principles and executable analysis scripts.

## Overview

This skill provides **automated analysis scripts** that evaluate Vibe Coding outputs across four dimensions:

1. **Traceability** (25%): Requirements → Code mapping analysis
2. **Compliance** (25%): API specification adherence verification
3. **Quality** (30%): Code architecture, standards, SOLID principles
4. **Verification** (20%): Functional correctness (requires manual testing)

## Quick Start

### One-Command Evaluation

For complete automated evaluation:

```bash
python3 scripts/generate_report.py /path/to/repository
```

This runs all analysis scripts and generates a comprehensive evaluation report.

### Individual Analysis Scripts

For targeted analysis, run scripts individually:

```bash
# Requirements traceability
python3 scripts/analyze_traceability.py /path/to/repo --output traceability_report.md --json

# API compliance checking  
python3 scripts/check_api_compliance.py /path/to/repo --spec spec.md --json

# Code quality measurement
python3 scripts/measure_code_quality.py /path/to/repo --output quality_report.md
```

## Analysis Scripts

### 1. Requirements Traceability Analyzer

**Purpose**: Maps requirements to implementation, identifies gaps

**Script**: `scripts/analyze_traceability.py`

**What it does**:
- Parses `requirements.md` to extract requirement IDs (FR-01, NFR-01, etc.)
- Searches codebase using ripgrep/grep for requirement mentions
- Categorizes findings: backend files, frontend files, test files
- Searches git commits for requirement references
- Calculates implementation rates (Must/Should/Could)
- Generates detailed traceability matrix

**Usage**:
```bash
python3 scripts/analyze_traceability.py [repo_path] [options]

Options:
  --requirements FILE    Path to requirements file (default: requirements.md)
  --output FILE          Output report file (default: traceability_report.md)
  --json                 Also export JSON data
```

**Output**:
- `traceability_report.md`: Human-readable report with completion rates
- `traceability_data.json`: Machine-readable data (if --json used)

**Example workflow**:
```bash
# Analyze traceability
python3 scripts/analyze_traceability.py . --json

# Review findings
cat traceability_report.md

# Check specific requirement
grep -r "FR-01" src/
```

### 2. API Compliance Checker

**Purpose**: Verifies API implementation matches specification

**Script**: `scripts/check_api_compliance.py`

**What it does**:
- Parses `spec.md` to extract API endpoint definitions
- Searches code for Spring Boot annotations (@PostMapping, @GetMapping, etc.)
- Compares endpoint paths, HTTP methods
- Identifies missing or mismatched implementations
- Detects undocumented implementations
- Categorizes issues by severity (critical/major/minor)

**Usage**:
```bash
python3 scripts/check_api_compliance.py [repo_path] [options]

Options:
  --spec FILE      Path to specification file (default: spec.md)
  --output FILE    Output report file (default: api_compliance_report.md)
  --json           Also export JSON data
```

**Output**:
- `api_compliance_report.md`: Compliance report with issue details
- `api_compliance_data.json`: Structured data (if --json used)

**Example workflow**:
```bash
# Check API compliance
python3 scripts/check_api_compliance.py . --spec docs/api-spec.md --json

# Fix critical issues
# Re-run to verify
python3 scripts/check_api_compliance.py .
```

### 3. Code Quality Analyzer

**Purpose**: Measures code quality across architecture, standards, SOLID principles

**Script**: `scripts/measure_code_quality.py`

**What it does**:
- Scans Java/Kotlin files for architectural patterns
- Detects layer violations (business logic in controllers)
- Checks dependency injection patterns (field vs constructor)
- Validates @Transactional usage
- Identifies error handling anti-patterns
- Counts test files and estimates coverage
- Calculates overall quality score (0-100)

**Usage**:
```bash
python3 scripts/measure_code_quality.py [repo_path] [options]

Options:
  --output FILE    Output report file (default: code_quality_report.md)
```

**Output**:
- `code_quality_report.md`: Detailed quality report with metrics and issues

**Quality dimensions checked**:
- **Architecture**: Controller/Service/Repository separation, DTO usage
- **Standards**: Dependency injection style, transaction management
- **Error Handling**: Custom exceptions, global handlers, logging
- **Testing**: Test files, unit tests, integration tests

**Example workflow**:
```bash
# Analyze quality
python3 scripts/measure_code_quality.py .

# Review issues
cat code_quality_report.md

# Fix major issues and re-run
python3 scripts/measure_code_quality.py .
```

### 4. Comprehensive Report Generator

**Purpose**: Runs all analyses and generates unified TRACE evaluation

**Script**: `scripts/generate_report.py`

**What it does**:
- Orchestrates all three analysis scripts
- Collects and aggregates results
- Calculates weighted overall score
- Determines deployment readiness grade
- Generates prioritized recommendations
- Produces comprehensive evaluation report

**Usage**:
```bash
python3 scripts/generate_report.py [repo_path] [options]

Options:
  --output FILE        Output report file (default: evaluation_report.md)
  --skip-analysis      Use existing reports instead of re-running
```

**Output**:
- `evaluation_report.md`: Complete TRACE evaluation with all dimensions
- Individual reports from each analysis script

**Scoring**:
- Traceability: 25% weight
- API Compliance: 25% weight  
- Code Quality: 30% weight
- Functional Verification: 20% weight (manual)

**Grading**:
- 🟢 90-100: Excellent (Production ready)
- 🟡 70-89: Good (Deploy after minor fixes)
- 🟠 50-69: Fair (Refactoring needed)
- 🔴 <50: Poor (Major rework required)

## Evaluation Workflow

### Standard Workflow

1. **Locate artifacts** - Ensure requirements.md, spec.md exist in repository

2. **Run comprehensive evaluation**:
   ```bash
   cd /path/to/repository
   python3 /path/to/skill/scripts/generate_report.py .
   ```

3. **Review generated reports**:
   - `evaluation_report.md` - Overall assessment
   - `traceability_report.md` - Requirements coverage
   - `api_compliance_report.md` - API correctness
   - `code_quality_report.md` - Quality metrics

4. **Address critical issues** - Fix issues marked as critical/major

5. **Re-evaluate** - Run scripts again after fixes

6. **Deploy** - When score ≥70 and critical issues resolved

### Iterative Improvement Workflow

For continuous improvement:

```bash
# Initial baseline
python3 scripts/generate_report.py . --output baseline_report.md

# Fix issues
# ... make code changes ...

# Re-evaluate specific dimension
python3 scripts/analyze_traceability.py .
# or
python3 scripts/check_api_compliance.py .
# or  
python3 scripts/measure_code_quality.py .

# Full re-evaluation
python3 scripts/generate_report.py . --output improved_report.md

# Compare scores
diff baseline_report.md improved_report.md
```

## Integration with Development Tools

### Git Integration

Use git commands to enhance analysis:

```bash
# Find requirements in recent commits
git log --grep="FR-" --oneline

# See what changed since last evaluation
git diff --stat HEAD~10

# Focus analysis on changed files
git diff --name-only HEAD~10 | xargs grep -l "FR-01"
```

### CI/CD Integration

Add to CI pipeline:

```yaml
# .github/workflows/quality-check.yml
- name: Run Vibe Code Evaluation
  run: |
    python3 scripts/generate_report.py .
    if [ $? -ne 0 ]; then
      echo "Quality check failed"
      exit 1
    fi

- name: Upload Reports
  uses: actions/upload-artifact@v3
  with:
    name: evaluation-reports
    path: |
      evaluation_report.md
      *_report.md
```

### IDE Integration

Run scripts from IDE terminal or create tasks:

```json
// VSCode tasks.json
{
  "label": "Evaluate Vibe Coding",
  "type": "shell",
  "command": "python3 ${workspaceFolder}/../evaluate-vibe-codes/scripts/generate_report.py ${workspaceFolder}"
}
```

## Understanding the Analysis

### Requirements Traceability

**Key metrics**:
- Must-have implementation rate (target: 100%)
- Overall implementation rate
- Partial vs Missing requirements

**Interpretation**:
- ✅ Complete: All components implemented (backend + frontend + tests)
- ⚠️ Partial: Some components missing
- ❌ Missing: No implementation found

**Common issues**:
- Requirements not mentioned in code (use comments/docs)
- Tests missing for implemented features
- Frontend incomplete for backend APIs

### API Compliance

**Key metrics**:
- Endpoint path accuracy
- HTTP method correctness
- Request/response schema matching

**Interpretation**:
- 🔴 Critical: Missing endpoints, wrong paths
- 🟡 Major: Schema mismatches, status code issues  
- 🔵 Minor: Undocumented endpoints

**Common issues**:
- Path versioning mismatches (/api/v1/boards vs /boards)
- Wrong HTTP status codes (200 instead of 201)
- Missing error handling endpoints

### Code Quality

**Key metrics**:
- Architecture score (layering, DTO usage)
- Standards score (DI, transactions)
- Error handling score
- Test coverage

**Interpretation**:
- 90-100: Excellent architecture and practices
- 70-89: Good with minor anti-patterns
- 50-69: Multiple violations, needs refactoring
- <50: Poor structure, major issues

**Common issues**:
- Field injection instead of constructor injection
- Business logic in controllers
- Entities exposed directly in APIs
- Missing global exception handler
- No unit tests for services

## Troubleshooting

### Script Fails to Find Requirements

**Issue**: "No requirements found in requirements.md"

**Solution**:
- Ensure requirements.md exists in repository root
- Check requirement ID format (must be: FR-01, NFR-01, etc.)
- Use `--requirements` flag to specify custom location

### Git Commands Not Working

**Issue**: Scripts report git errors

**Solution**:
- Ensure repository is a valid git repository
- Check git is installed: `git --version`
- Scripts work without git but lose commit history analysis

### No Java/Kotlin Files Found

**Issue**: Code quality analysis finds no files

**Solution**:
- Verify repository structure (src/main/java or src/)
- Check file extensions (.java, .kt)
- Scripts currently support Java/Kotlin backend analysis

### Performance Issues

**Issue**: Scripts take too long

**Solution**:
- Use ripgrep (rg) for faster searching: `brew install ripgrep`
- Exclude large directories: add to .gitignore
- Run individual scripts instead of generate_report.py

## Advanced Usage

### Custom Requirement Patterns

Modify `analyze_traceability.py` to match your requirement format:

```python
# Default pattern: FR-01, NFR-01
req_pattern = r'((?:FR|NFR|BR|TR)-\d+)'

# Custom pattern: REQ_USER_001
req_pattern = r'(REQ_[A-Z]+_\d+)'
```

### Extended Language Support

Add support for other languages by updating patterns in scripts:

```python
# In check_api_compliance.py
# Add FastAPI pattern
backend_patterns.append((
    r'@app\.(get|post|put|delete)\s*\(["\']([^"\']+)["\']',
    'python'
))
```

### Integration with Testing Tools

Combine with coverage tools:

```bash
# Run tests with coverage
./gradlew test jacocoTestReport

# Analyze quality (will pick up coverage data)
python3 scripts/measure_code_quality.py .
```

## Tips

- Run evaluation early and often during development
- Fix critical issues before major/minor ones
- Use JSON export for tracking metrics over time
- Integrate into PR checks for consistent quality
- Focus on Must requirements first
- Aim for 80%+ in all dimensions
- Re-run after each significant change

## References

- [references/evaluation-framework.md](references/evaluation-framework.md) - Complete TRACE methodology details
- [references/checklist-template.md](references/checklist-template.md) - Manual evaluation checklist
