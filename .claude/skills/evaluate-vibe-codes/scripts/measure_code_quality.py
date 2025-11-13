#!/usr/bin/env python3
"""
Code Quality Analyzer

Measures code quality across multiple dimensions:
- Architecture patterns (layered architecture, DTO usage)
- Coding standards (dependency injection, transaction management)
- SOLID principles
- Error handling patterns
- Test coverage
"""

import re
import sys
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict


@dataclass
class QualityIssue:
    """Represents a code quality issue."""
    category: str  # architecture, standards, solid, error_handling, testing
    severity: str  # critical, major, minor
    issue: str
    file_path: str
    line_number: int
    recommendation: str


@dataclass
class QualityMetrics:
    """Represents code quality metrics."""
    total_files: int
    total_lines: int
    
    # Architecture
    controllers: int
    services: int
    repositories: int
    dto_usage_rate: float
    
    # Standards
    field_injection_count: int
    constructor_injection_count: int
    transactional_usage: int
    
    # Error handling
    try_catch_blocks: int
    custom_exceptions: int
    global_exception_handlers: int
    
    # Testing
    test_files: int
    unit_tests: int
    integration_tests: int
    
    # Issues
    critical_issues: int
    major_issues: int
    minor_issues: int


class CodeQualityAnalyzer:
    """Analyzes code quality across the codebase."""
    
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path)
        self.issues: List[QualityIssue] = []
        self.metrics = None
    
    def analyze(self) -> QualityMetrics:
        """Perform complete code quality analysis."""
        print(f"\n🔍 Analyzing Code Quality in {self.repo_path}")
        print("=" * 70)
        
        # Initialize metrics
        metrics = {
            'total_files': 0,
            'total_lines': 0,
            'controllers': 0,
            'services': 0,
            'repositories': 0,
            'dto_usage_rate': 0.0,
            'field_injection_count': 0,
            'constructor_injection_count': 0,
            'transactional_usage': 0,
            'try_catch_blocks': 0,
            'custom_exceptions': 0,
            'global_exception_handlers': 0,
            'test_files': 0,
            'unit_tests': 0,
            'integration_tests': 0,
            'critical_issues': 0,
            'major_issues': 0,
            'minor_issues': 0
        }
        
        # Analyze architecture
        print("\n📐 Checking Architecture Patterns...")
        self._check_architecture(metrics)
        
        # Analyze coding standards
        print("\n📝 Checking Coding Standards...")
        self._check_coding_standards(metrics)
        
        # Analyze error handling
        print("\n⚠️  Checking Error Handling...")
        self._check_error_handling(metrics)
        
        # Analyze tests
        print("\n🧪 Checking Test Coverage...")
        self._check_tests(metrics)
        
        # Count issues
        metrics['critical_issues'] = len([i for i in self.issues if i.severity == "critical"])
        metrics['major_issues'] = len([i for i in self.issues if i.severity == "major"])
        metrics['minor_issues'] = len([i for i in self.issues if i.severity == "minor"])
        
        self.metrics = QualityMetrics(**metrics)
        return self.metrics
    
    def _check_architecture(self, metrics: Dict):
        """Check architecture patterns."""
        # Count layers
        for java_file in self.repo_path.rglob("*.java"):
            if 'test' in str(java_file).lower():
                continue
            
            metrics['total_files'] += 1
            
            try:
                with open(java_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')
                    metrics['total_lines'] += len(lines)
                
                # Check for Controller
                if re.search(r'@RestController|@Controller', content):
                    metrics['controllers'] += 1
                    
                    # Check for business logic in controller (anti-pattern)
                    if self._has_business_logic_in_controller(content):
                        self.issues.append(QualityIssue(
                            category="architecture",
                            severity="major",
                            issue="Business logic found in controller",
                            file_path=str(java_file.relative_to(self.repo_path)),
                            line_number=0,
                            recommendation="Move business logic to service layer"
                        ))
                    
                    # Check if Entity is directly returned (anti-pattern)
                    if self._returns_entity_directly(content):
                        self.issues.append(QualityIssue(
                            category="architecture",
                            severity="major",
                            issue="Entity returned directly from controller",
                            file_path=str(java_file.relative_to(self.repo_path)),
                            line_number=0,
                            recommendation="Use DTO pattern to separate Entity from API response"
                        ))
                
                # Check for Service
                if re.search(r'@Service', content):
                    metrics['services'] += 1
                
                # Check for Repository
                if re.search(r'@Repository|interface.*Repository|extends JpaRepository', content):
                    metrics['repositories'] += 1
                
                # Check DTO usage
                if re.search(r'record.*Response|record.*Request|class.*DTO', content):
                    metrics['dto_usage_rate'] += 1
            
            except Exception:
                pass
        
        # Calculate DTO usage rate
        if metrics['controllers'] > 0:
            # Rough estimate: DTOs should be at least as many as controllers
            metrics['dto_usage_rate'] = min(100, (metrics['dto_usage_rate'] / (metrics['controllers'] * 2)) * 100)
        
        print(f"  Controllers: {metrics['controllers']}")
        print(f"  Services: {metrics['services']}")
        print(f"  Repositories: {metrics['repositories']}")
        print(f"  DTO Usage: {metrics['dto_usage_rate']:.1f}%")
    
    def _has_business_logic_in_controller(self, content: str) -> bool:
        """Check if controller has business logic."""
        # Simple heuristics: looking for complex logic in controller methods
        lines = content.split('\n')
        in_controller_method = False
        logic_indicators = 0
        
        for line in lines:
            if '@GetMapping' in line or '@PostMapping' in line or '@PutMapping' in line or '@DeleteMapping' in line:
                in_controller_method = True
                logic_indicators = 0
            
            if in_controller_method:
                # Check for business logic indicators
                if any(keyword in line for keyword in ['if (', 'for (', 'while (', 'switch (', '.save(', '.delete(']):
                    logic_indicators += 1
                
                # Method ended
                if line.strip().startswith('}') and logic_indicators > 2:
                    return True
                
                if line.strip().startswith('public ') or line.strip().startswith('private '):
                    in_controller_method = False
        
        return False
    
    def _returns_entity_directly(self, content: str) -> bool:
        """Check if controller returns Entity directly."""
        # Look for methods returning Entity types (not DTOs)
        entity_return_pattern = r'ResponseEntity<(\w+)>'
        matches = re.findall(entity_return_pattern, content)
        
        for match in matches:
            # If return type doesn't end with Response/Request/DTO, likely an Entity
            if not any(suffix in match for suffix in ['Response', 'Request', 'DTO', 'String', 'Void', 'Page', 'List']):
                # Check if it's annotated with @Entity
                if re.search(rf'@Entity\s+(?:public\s+)?class\s+{match}', content):
                    return True
        
        return False
    
    def _check_coding_standards(self, metrics: Dict):
        """Check coding standards."""
        for java_file in self.repo_path.rglob("*.java"):
            if 'test' in str(java_file).lower():
                continue
            
            try:
                with open(java_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')
                
                # Check dependency injection style
                field_injection = len(re.findall(r'@Autowired\s+private', content))
                constructor_injection = len(re.findall(r'@RequiredArgsConstructor|private final.*Repository|private final.*Service', content))
                
                metrics['field_injection_count'] += field_injection
                metrics['constructor_injection_count'] += constructor_injection
                
                if field_injection > 0:
                    for i, line in enumerate(lines, 1):
                        if '@Autowired' in line and 'private' in line:
                            self.issues.append(QualityIssue(
                                category="standards",
                                severity="minor",
                                issue="Field injection used (anti-pattern)",
                                file_path=str(java_file.relative_to(self.repo_path)),
                                line_number=i,
                                recommendation="Use constructor injection instead (@RequiredArgsConstructor)"
                            ))
                
                # Check @Transactional usage
                transactional_count = len(re.findall(r'@Transactional', content))
                metrics['transactional_usage'] += transactional_count
                
                # Check for setter usage (anti-pattern in domain models)
                if re.search(r'@Entity', content):
                    setter_count = len(re.findall(r'\.set[A-Z]\w+\(', content))
                    if setter_count > 5:  # Threshold
                        self.issues.append(QualityIssue(
                            category="standards",
                            severity="minor",
                            issue="Excessive setter usage in entity",
                            file_path=str(java_file.relative_to(self.repo_path)),
                            line_number=0,
                            recommendation="Use builder pattern or constructor for entity creation"
                        ))
            
            except Exception:
                pass
        
        print(f"  Field injection: {metrics['field_injection_count']}")
        print(f"  Constructor injection: {metrics['constructor_injection_count']}")
        print(f"  @Transactional usage: {metrics['transactional_usage']}")
    
    def _check_error_handling(self, metrics: Dict):
        """Check error handling patterns."""
        for java_file in self.repo_path.rglob("*.java"):
            try:
                with open(java_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')
                
                # Count try-catch blocks
                try_catch = len(re.findall(r'\btry\s*\{', content))
                metrics['try_catch_blocks'] += try_catch
                
                # Check for custom exceptions
                if 'extends RuntimeException' in content or 'extends Exception' in content:
                    metrics['custom_exceptions'] += 1
                
                # Check for global exception handler
                if '@RestControllerAdvice' in content or '@ControllerAdvice' in content:
                    metrics['global_exception_handlers'] += 1
                
                # Check for bad error handling patterns
                if 'e.printStackTrace()' in content:
                    for i, line in enumerate(lines, 1):
                        if 'printStackTrace' in line:
                            self.issues.append(QualityIssue(
                                category="error_handling",
                                severity="major",
                                issue="printStackTrace() used instead of proper logging",
                                file_path=str(java_file.relative_to(self.repo_path)),
                                line_number=i,
                                recommendation="Use logger.error() instead"
                            ))
                
                # Check for catching generic Exception
                generic_catch = len(re.findall(r'catch\s*\(\s*Exception\s+', content))
                if generic_catch > 0 and 'test' not in str(java_file).lower():
                    self.issues.append(QualityIssue(
                        category="error_handling",
                        severity="minor",
                        issue="Generic Exception caught (too broad)",
                        file_path=str(java_file.relative_to(self.repo_path)),
                        line_number=0,
                        recommendation="Catch specific exception types"
                    ))
            
            except Exception:
                pass
        
        print(f"  Try-catch blocks: {metrics['try_catch_blocks']}")
        print(f"  Custom exceptions: {metrics['custom_exceptions']}")
        print(f"  Global exception handlers: {metrics['global_exception_handlers']}")
    
    def _check_tests(self, metrics: Dict):
        """Check test coverage."""
        # Count test files
        for test_file in self.repo_path.rglob("*Test.java"):
            metrics['test_files'] += 1
            
            try:
                with open(test_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Count test methods
                test_methods = len(re.findall(r'@Test', content))
                
                # Categorize tests
                if '@SpringBootTest' in content or '@WebMvcTest' in content:
                    metrics['integration_tests'] += test_methods
                else:
                    metrics['unit_tests'] += test_methods
            
            except Exception:
                pass
        
        # Try to get coverage from jacoco or other tools
        coverage_files = list(self.repo_path.rglob("jacoco.xml")) + list(self.repo_path.rglob("coverage.xml"))
        
        if not coverage_files:
            print(f"  Test files: {metrics['test_files']}")
            print(f"  Unit tests: {metrics['unit_tests']}")
            print(f"  Integration tests: {metrics['integration_tests']}")
            print(f"  ⚠️  No coverage report found (jacoco.xml)")
        
        # Check if tests are missing for services
        service_files = list(self.repo_path.rglob("*Service.java"))
        service_files = [f for f in service_files if 'test' not in str(f).lower()]
        
        tested_services = set()
        for test_file in self.repo_path.rglob("*ServiceTest.java"):
            service_name = test_file.stem.replace('Test', '')
            tested_services.add(service_name)
        
        untested_services = []
        for service_file in service_files:
            service_name = service_file.stem
            if service_name not in tested_services:
                untested_services.append(str(service_file.relative_to(self.repo_path)))
        
        if untested_services:
            for service in untested_services[:5]:  # Limit to 5
                self.issues.append(QualityIssue(
                    category="testing",
                    severity="major",
                    issue="Service without corresponding test",
                    file_path=service,
                    line_number=0,
                    recommendation="Create unit tests for service layer"
                ))
    
    def calculate_score(self) -> int:
        """Calculate overall quality score (0-100)."""
        if not self.metrics:
            return 0
        
        score = 100
        
        # Deduct points for issues
        score -= self.metrics.critical_issues * 10
        score -= self.metrics.major_issues * 5
        score -= self.metrics.minor_issues * 2
        
        # Bonus for good practices
        if self.metrics.global_exception_handlers > 0:
            score += 5
        
        if self.metrics.dto_usage_rate > 80:
            score += 5
        
        if self.metrics.constructor_injection_count > self.metrics.field_injection_count:
            score += 5
        
        return max(0, min(100, score))
    
    def generate_report(self, output_file: str = "code_quality_report.md") -> str:
        """Generate quality report."""
        if not self.metrics:
            return ""
        
        score = self.calculate_score()
        
        # Determine grade
        if score >= 90:
            grade = "🟢 Excellent"
            assessment = "Production-ready code quality"
        elif score >= 70:
            grade = "🟡 Good"
            assessment = "Acceptable quality, minor improvements needed"
        elif score >= 50:
            grade = "🟠 Fair"
            assessment = "Significant refactoring needed"
        else:
            grade = "🔴 Poor"
            assessment = "Major quality issues, rework required"
        
        # Generate report
        report = f"""# Code Quality Analysis Report

**Generated**: {self._get_timestamp()}  
**Repository**: {self.repo_path}

## Executive Summary

**Overall Score**: {score}/100  
**Grade**: {grade}  
**Assessment**: {assessment}

### Metrics Overview

| Metric | Value |
|--------|-------|
| Total Files | {self.metrics.total_files} |
| Total Lines | {self.metrics.total_lines} |
| Controllers | {self.metrics.controllers} |
| Services | {self.metrics.services} |
| Repositories | {self.metrics.repositories} |
| DTO Usage Rate | {self.metrics.dto_usage_rate:.1f}% |

### Issues Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | {self.metrics.critical_issues} |
| 🟡 Major | {self.metrics.major_issues} |
| 🔵 Minor | {self.metrics.minor_issues} |

---

## Architecture Patterns

### Layer Separation
- Controllers: {self.metrics.controllers}
- Services: {self.metrics.services}
- Repositories: {self.metrics.repositories}

### DTO Pattern
- Usage Rate: {self.metrics.dto_usage_rate:.1f}%

"""
        
        if self.metrics.dto_usage_rate < 50:
            report += "⚠️ **Warning**: Low DTO usage detected. Consider using DTOs to separate API layer from domain layer.\n\n"
        
        report += """---

## Coding Standards

### Dependency Injection
"""
        
        report += f"- Constructor Injection: {self.metrics.constructor_injection_count}\n"
        report += f"- Field Injection: {self.metrics.field_injection_count}\n\n"
        
        if self.metrics.field_injection_count > 0:
            report += "⚠️ **Warning**: Field injection is an anti-pattern. Use constructor injection.\n\n"
        
        report += f"""### Transaction Management
- @Transactional Usage: {self.metrics.transactional_usage}

---

## Error Handling

- Try-Catch Blocks: {self.metrics.try_catch_blocks}
- Custom Exceptions: {self.metrics.custom_exceptions}
- Global Exception Handlers: {self.metrics.global_exception_handlers}

"""
        
        if self.metrics.global_exception_handlers == 0:
            report += "⚠️ **Warning**: No global exception handler found. Consider using @RestControllerAdvice.\n\n"
        
        report += f"""---

## Test Coverage

- Test Files: {self.metrics.test_files}
- Unit Tests: {self.metrics.unit_tests}
- Integration Tests: {self.metrics.integration_tests}

"""
        
        # Issues by category
        if self.issues:
            report += "---\n\n## Detailed Issues\n\n"
            
            for severity in ["critical", "major", "minor"]:
                severity_issues = [i for i in self.issues if i.severity == severity]
                if severity_issues:
                    emoji = "🔴" if severity == "critical" else "🟡" if severity == "major" else "🔵"
                    report += f"### {emoji} {severity.title()} Issues ({len(severity_issues)})\n\n"
                    
                    # Group by category
                    by_category = defaultdict(list)
                    for issue in severity_issues:
                        by_category[issue.category].append(issue)
                    
                    for category, issues in by_category.items():
                        report += f"#### {category.replace('_', ' ').title()}\n\n"
                        
                        for issue in issues[:10]:  # Limit to 10 per category
                            report += f"**{issue.issue}**\n"
                            report += f"- File: {issue.file_path}"
                            if issue.line_number > 0:
                                report += f":{issue.line_number}"
                            report += f"\n- Recommendation: {issue.recommendation}\n\n"
        
        # Recommendations
        report += """---

## Recommendations

"""
        
        recommendations = []
        
        if self.metrics.critical_issues > 0:
            recommendations.append("1. **Critical**: Address critical issues immediately before deployment")
        
        if self.metrics.field_injection_count > 0:
            recommendations.append("2. **Dependency Injection**: Refactor field injection to constructor injection")
        
        if self.metrics.dto_usage_rate < 50:
            recommendations.append("3. **DTO Pattern**: Implement DTOs to separate API from domain layer")
        
        if self.metrics.global_exception_handlers == 0:
            recommendations.append("4. **Error Handling**: Add @RestControllerAdvice for centralized error handling")
        
        if self.metrics.test_files == 0:
            recommendations.append("5. **Testing**: Add unit and integration tests (target: 80% coverage)")
        
        for i, rec in enumerate(recommendations, 1):
            report += f"{rec}\n"
        
        if not recommendations:
            report += "✅ No major recommendations. Code quality is good!\n"
        
        # Save report
        output_path = self.repo_path / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n✅ Report saved to: {output_path}")
        return report
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Analyze code quality across multiple dimensions'
    )
    parser.add_argument(
        'repo_path',
        nargs='?',
        default='.',
        help='Path to repository (default: current directory)'
    )
    parser.add_argument(
        '--output',
        default='code_quality_report.md',
        help='Output report file (default: code_quality_report.md)'
    )
    
    args = parser.parse_args()
    
    analyzer = CodeQualityAnalyzer(args.repo_path)
    metrics = analyzer.analyze()
    analyzer.generate_report(args.output)
    
    # Print summary
    score = analyzer.calculate_score()
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"📈 Overall Score: {score}/100")
    print(f"📁 Files Analyzed: {metrics.total_files}")
    print(f"📝 Total Lines: {metrics.total_lines}")
    print(f"⚠️  Issues: {metrics.critical_issues} critical, {metrics.major_issues} major, {metrics.minor_issues} minor")
    
    if score >= 70:
        print("\n✅ Code quality is acceptable")
    else:
        print("\n⚠️  Code quality needs improvement")
        sys.exit(1)


if __name__ == '__main__':
    main()
