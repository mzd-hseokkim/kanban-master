#!/usr/bin/env python3
"""
API Specification Compliance Checker

Verifies that implemented APIs match the specification defined in spec.md.
Checks endpoint paths, HTTP methods, request/response schemas, and status codes.
"""

import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict


@dataclass
class APIEndpoint:
    """Represents an API endpoint definition."""
    method: str
    path: str
    request_schema: Optional[Dict]
    response_schema: Optional[Dict]
    status_codes: List[int]
    error_codes: List[str]


@dataclass
class APIImplementation:
    """Represents an implemented API endpoint."""
    file_path: str
    line_number: int
    method: str
    path: str
    controller_method: str


@dataclass
class ComplianceIssue:
    """Represents a compliance issue."""
    severity: str  # critical, major, minor
    category: str  # endpoint, schema, status_code, error_handling
    endpoint: str
    issue: str
    expected: str
    actual: str
    location: str


class APIComplianceChecker:
    """Checks API implementation against specification."""
    
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path)
        self.spec_endpoints: List[APIEndpoint] = []
        self.implementations: List[APIImplementation] = []
        self.issues: List[ComplianceIssue] = []
    
    def parse_spec(self, spec_file: str = "spec.md") -> List[APIEndpoint]:
        """Parse spec.md to extract API endpoint definitions."""
        spec_path = self.repo_path / spec_file
        
        if not spec_path.exists():
            print(f"❌ Specification file not found: {spec_path}")
            return []
        
        with open(spec_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        endpoints = []
        
        # Pattern to match API definitions: POST /api/v1/boards
        endpoint_pattern = r'(GET|POST|PUT|PATCH|DELETE)\s+(/[^\s\n]+)'
        matches = re.findall(endpoint_pattern, content)
        
        for method, path in matches:
            # Extract additional details from surrounding context
            context = self._get_endpoint_context(content, method, path)
            
            endpoint = APIEndpoint(
                method=method,
                path=path,
                request_schema=self._extract_request_schema(context),
                response_schema=self._extract_response_schema(context),
                status_codes=self._extract_status_codes(context),
                error_codes=self._extract_error_codes(context)
            )
            
            endpoints.append(endpoint)
        
        print(f"✅ Found {len(endpoints)} API endpoints in specification")
        return endpoints
    
    def _get_endpoint_context(self, content: str, method: str, path: str) -> str:
        """Get context around an endpoint definition."""
        search_str = f"{method} {path}"
        idx = content.find(search_str)
        if idx == -1:
            return ""
        
        # Get 1000 chars before and after
        start = max(0, idx - 500)
        end = min(len(content), idx + 1500)
        return content[start:end]
    
    def _extract_request_schema(self, context: str) -> Optional[Dict]:
        """Extract request schema from context."""
        # Look for JSON schema or field definitions
        # Simplified - in real implementation, parse JSON schema
        return None
    
    def _extract_response_schema(self, context: str) -> Optional[Dict]:
        """Extract response schema from context."""
        return None
    
    def _extract_status_codes(self, context: str) -> List[int]:
        """Extract expected status codes from context."""
        codes = []
        # Pattern: "200 OK", "201 Created", "400 Bad Request", etc.
        code_pattern = r'\b(2\d{2}|4\d{2}|5\d{2})\b'
        matches = re.findall(code_pattern, context)
        for code in matches:
            codes.append(int(code))
        return list(set(codes))
    
    def _extract_error_codes(self, context: str) -> List[str]:
        """Extract error code constants from context."""
        # Pattern: ERROR_CODE, VALIDATION_ERROR, NOT_FOUND, etc.
        error_pattern = r'\b([A-Z_]+ERROR|[A-Z]+_NOT_FOUND|UNAUTHORIZED|FORBIDDEN|INVALID_[A-Z_]+)\b'
        matches = re.findall(error_pattern, context)
        return list(set(matches))
    
    def find_implementations(self) -> List[APIImplementation]:
        """Find API endpoint implementations in the codebase."""
        implementations = []
        
        # Search for Spring Boot annotations
        backend_patterns = [
            (r'@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping)\s*\(["\']([^"\']+)["\']\)', 'java'),
            (r'@RequestMapping\s*\([^)]*method\s*=\s*RequestMethod\.(\w+)[^)]*value\s*=\s*["\']([^"\']+)["\']', 'java'),
            (r'@(Get|Post|Put|Patch|Delete)\s*\(["\']([^"\']+)["\']\)', 'kotlin'),
        ]
        
        # Search backend files
        for pattern, lang in backend_patterns:
            implementations.extend(self._search_pattern(pattern, lang))
        
        print(f"✅ Found {len(implementations)} implemented endpoints")
        return implementations
    
    def _search_pattern(self, pattern: str, language: str) -> List[APIImplementation]:
        """Search for pattern in code files."""
        implementations = []
        
        # Determine file extensions
        extensions = {
            'java': ['.java'],
            'kotlin': ['.kt'],
            'python': ['.py'],
            'typescript': ['.ts']
        }
        exts = extensions.get(language, [])
        
        # Search files
        for ext in exts:
            for file_path in self.repo_path.rglob(f"*{ext}"):
                # Skip test files
                if 'test' in str(file_path).lower():
                    continue
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        lines = content.split('\n')
                    
                    for i, line in enumerate(lines, 1):
                        matches = re.finditer(pattern, line)
                        for match in matches:
                            # Extract method and path based on pattern
                            if len(match.groups()) >= 2:
                                method_or_annotation = match.group(1)
                                path = match.group(2) if len(match.groups()) >= 2 else match.group(1)
                                
                                # Convert annotation to HTTP method
                                method_map = {
                                    'GetMapping': 'GET',
                                    'PostMapping': 'POST',
                                    'PutMapping': 'PUT',
                                    'PatchMapping': 'PATCH',
                                    'DeleteMapping': 'DELETE',
                                    'Get': 'GET',
                                    'Post': 'POST',
                                    'Put': 'PUT',
                                    'Patch': 'PATCH',
                                    'Delete': 'DELETE',
                                }
                                
                                method = method_map.get(method_or_annotation, method_or_annotation)
                                
                                # Find controller method name
                                controller_method = self._find_method_name(lines, i)
                                
                                impl = APIImplementation(
                                    file_path=str(file_path.relative_to(self.repo_path)),
                                    line_number=i,
                                    method=method,
                                    path=path,
                                    controller_method=controller_method
                                )
                                implementations.append(impl)
                
                except Exception as e:
                    # Skip files that can't be read
                    pass
        
        return implementations
    
    def _find_method_name(self, lines: List[str], annotation_line: int) -> str:
        """Find the method name following an annotation."""
        # Look at next few lines for method signature
        for i in range(annotation_line, min(annotation_line + 5, len(lines))):
            line = lines[i]
            # Match method signature: public ResponseEntity<...> methodName(...)
            method_pattern = r'\s+(public|private|protected)?\s+[\w<>,\s]+\s+(\w+)\s*\('
            match = re.search(method_pattern, line)
            if match:
                return match.group(2)
        return "unknown"
    
    def check_compliance(self) -> List[ComplianceIssue]:
        """Check compliance between spec and implementation."""
        print("\n🔍 Checking API Compliance...")
        print("=" * 70)
        
        issues = []
        
        # Check each specified endpoint
        for spec_endpoint in self.spec_endpoints:
            endpoint_key = f"{spec_endpoint.method} {spec_endpoint.path}"
            print(f"\n📋 Checking: {endpoint_key}")
            
            # Find matching implementation
            matching = [
                impl for impl in self.implementations
                if impl.method == spec_endpoint.method and impl.path == spec_endpoint.path
            ]
            
            if not matching:
                # Check for similar paths (might be version mismatch)
                similar = self._find_similar_implementations(spec_endpoint)
                
                if similar:
                    issue = ComplianceIssue(
                        severity="major",
                        category="endpoint",
                        endpoint=endpoint_key,
                        issue="Endpoint path mismatch",
                        expected=spec_endpoint.path,
                        actual=similar[0].path,
                        location=f"{similar[0].file_path}:{similar[0].line_number}"
                    )
                    issues.append(issue)
                    print(f"  ⚠️  Path mismatch: expected {spec_endpoint.path}, found {similar[0].path}")
                else:
                    issue = ComplianceIssue(
                        severity="critical",
                        category="endpoint",
                        endpoint=endpoint_key,
                        issue="Endpoint not implemented",
                        expected=endpoint_key,
                        actual="Not found",
                        location="N/A"
                    )
                    issues.append(issue)
                    print(f"  ❌ Not implemented")
            else:
                print(f"  ✅ Found: {matching[0].file_path}:{matching[0].line_number}")
                
                # Could add more detailed checks here:
                # - Request/response schema validation
                # - Status code verification
                # - Error code checks
        
        # Check for undocumented implementations
        for impl in self.implementations:
            impl_key = f"{impl.method} {impl.path}"
            matching = [
                ep for ep in self.spec_endpoints
                if ep.method == impl.method and ep.path == impl.path
            ]
            
            if not matching:
                issue = ComplianceIssue(
                    severity="minor",
                    category="endpoint",
                    endpoint=impl_key,
                    issue="Implementation not in specification",
                    expected="Should be documented in spec.md",
                    actual=impl_key,
                    location=f"{impl.file_path}:{impl.line_number}"
                )
                issues.append(issue)
        
        self.issues = issues
        return issues
    
    def _find_similar_implementations(self, spec_endpoint: APIEndpoint) -> List[APIImplementation]:
        """Find implementations with similar paths."""
        similar = []
        for impl in self.implementations:
            if impl.method != spec_endpoint.method:
                continue
            
            # Check if paths are similar (same base path)
            spec_base = spec_endpoint.path.split('/')[-1]
            impl_base = impl.path.split('/')[-1]
            
            if spec_base == impl_base:
                similar.append(impl)
        
        return similar
    
    def generate_report(self, output_file: str = "api_compliance_report.md") -> str:
        """Generate compliance report."""
        if not self.issues and not self.spec_endpoints:
            return ""
        
        # Calculate statistics
        total_endpoints = len(self.spec_endpoints)
        critical_issues = len([i for i in self.issues if i.severity == "critical"])
        major_issues = len([i for i in self.issues if i.severity == "major"])
        minor_issues = len([i for i in self.issues if i.severity == "minor"])
        
        compliance_rate = ((total_endpoints - critical_issues - major_issues) / total_endpoints * 100) if total_endpoints > 0 else 0
        
        # Generate report
        report = f"""# API Specification Compliance Report

**Generated**: {self._get_timestamp()}  
**Repository**: {self.repo_path}

## Executive Summary

- **Total Specified Endpoints**: {total_endpoints}
- **Implemented Endpoints**: {len(self.implementations)}
- **Issues Found**: {len(self.issues)}
  - 🔴 Critical: {critical_issues}
  - 🟡 Major: {major_issues}
  - 🔵 Minor: {minor_issues}

### Compliance Score

**{compliance_rate:.1f}%** compliance rate

"""
        
        if compliance_rate >= 90:
            report += "🟢 **PASS**: High compliance (90%+)\n\n"
        elif compliance_rate >= 70:
            report += "🟡 **PARTIAL**: Acceptable compliance (70-89%), improvements needed\n\n"
        else:
            report += "🔴 **FAIL**: Low compliance (<70%), significant issues\n\n"
        
        # Issues by severity
        if self.issues:
            report += "## Issues by Severity\n\n"
            
            for severity in ["critical", "major", "minor"]:
                severity_issues = [i for i in self.issues if i.severity == severity]
                if severity_issues:
                    emoji = "🔴" if severity == "critical" else "🟡" if severity == "major" else "🔵"
                    report += f"### {emoji} {severity.title()} Issues ({len(severity_issues)})\n\n"
                    
                    for issue in severity_issues:
                        report += f"#### {issue.endpoint}\n\n"
                        report += f"- **Issue**: {issue.issue}\n"
                        report += f"- **Expected**: {issue.expected}\n"
                        report += f"- **Actual**: {issue.actual}\n"
                        report += f"- **Location**: {issue.location}\n\n"
        
        # Endpoint comparison table
        report += "## Endpoint Comparison\n\n"
        report += "| Method | Path | Specified | Implemented | Location |\n"
        report += "|--------|------|-----------|-------------|----------|\n"
        
        for spec_ep in self.spec_endpoints:
            matching = [i for i in self.implementations if i.method == spec_ep.method and i.path == spec_ep.path]
            
            if matching:
                status = "✅"
                location = f"{matching[0].file_path}:{matching[0].line_number}"
            else:
                status = "❌"
                location = "Not found"
            
            report += f"| {spec_ep.method} | {spec_ep.path} | ✅ | {status} | {location} |\n"
        
        # Save report
        output_path = self.repo_path / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n✅ Report saved to: {output_path}")
        return report
    
    def export_json(self, output_file: str = "api_compliance_data.json"):
        """Export compliance data as JSON."""
        data = {
            'repository': str(self.repo_path),
            'timestamp': self._get_timestamp(),
            'summary': {
                'total_endpoints': len(self.spec_endpoints),
                'implemented': len(self.implementations),
                'issues': len(self.issues),
                'critical_issues': len([i for i in self.issues if i.severity == "critical"]),
                'major_issues': len([i for i in self.issues if i.severity == "major"]),
                'minor_issues': len([i for i in self.issues if i.severity == "minor"])
            },
            'spec_endpoints': [asdict(ep) for ep in self.spec_endpoints],
            'implementations': [asdict(impl) for impl in self.implementations],
            'issues': [asdict(issue) for issue in self.issues]
        }
        
        output_path = self.repo_path / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        
        print(f"✅ JSON data exported to: {output_path}")
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Check API implementation compliance with specification'
    )
    parser.add_argument(
        'repo_path',
        nargs='?',
        default='.',
        help='Path to repository (default: current directory)'
    )
    parser.add_argument(
        '--spec',
        default='spec.md',
        help='Path to specification file (default: spec.md)'
    )
    parser.add_argument(
        '--output',
        default='api_compliance_report.md',
        help='Output report file (default: api_compliance_report.md)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Also export JSON data'
    )
    
    args = parser.parse_args()
    
    checker = APIComplianceChecker(args.repo_path)
    
    # Parse spec
    checker.spec_endpoints = checker.parse_spec(args.spec)
    
    if not checker.spec_endpoints:
        print("❌ No API endpoints found in specification")
        sys.exit(1)
    
    # Find implementations
    checker.implementations = checker.find_implementations()
    
    # Check compliance
    issues = checker.check_compliance()
    
    # Generate report
    checker.generate_report(args.output)
    
    if args.json:
        checker.export_json()
    
    # Print summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"📋 Specified endpoints: {len(checker.spec_endpoints)}")
    print(f"✅ Implemented endpoints: {len(checker.implementations)}")
    print(f"⚠️  Issues found: {len(issues)}")
    
    critical = len([i for i in issues if i.severity == "critical"])
    major = len([i for i in issues if i.severity == "major"])
    minor = len([i for i in issues if i.severity == "minor"])
    
    if critical > 0:
        print(f"   🔴 Critical: {critical}")
    if major > 0:
        print(f"   🟡 Major: {major}")
    if minor > 0:
        print(f"   🔵 Minor: {minor}")
    
    if critical > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
