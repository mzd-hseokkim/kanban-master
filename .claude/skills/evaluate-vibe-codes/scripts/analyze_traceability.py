#!/usr/bin/env python3
"""
Requirements Traceability Analyzer

Analyzes the mapping between requirements.md and actual code implementation.
Searches for requirement IDs (FR-01, NFR-01, etc.) throughout the codebase.
"""

import re
import os
import sys
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple
from dataclasses import dataclass, asdict


@dataclass
class RequirementTrace:
    """Represents a requirement and its implementation traces."""
    req_id: str
    title: str
    priority: str  # Must, Should, Could
    backend_files: List[str]
    frontend_files: List[str]
    test_files: List[str]
    git_commits: List[str]
    status: str  # complete, partial, missing
    notes: str


class TraceabilityAnalyzer:
    """Analyzes requirements traceability across the codebase."""
    
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path)
        self.requirements: List[Dict] = []
        self.traces: List[RequirementTrace] = []
    
    def parse_requirements(self, req_file: str = "requirements.md") -> List[Dict]:
        """Parse requirements.md to extract requirement IDs and details."""
        req_path = self.repo_path / req_file
        
        if not req_path.exists():
            print(f"❌ Requirements file not found: {req_path}")
            return []
        
        with open(req_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match requirement IDs: FR-01, NFR-01, etc.
        req_pattern = r'((?:FR|NFR|BR|TR)-\d+):\s*([^\n]+)'
        matches = re.findall(req_pattern, content)
        
        requirements = []
        for req_id, title in matches:
            # Try to determine priority from context
            priority = self._determine_priority(content, req_id)
            requirements.append({
                'id': req_id,
                'title': title.strip(),
                'priority': priority
            })
        
        print(f"✅ Found {len(requirements)} requirements in {req_file}")
        return requirements
    
    def _determine_priority(self, content: str, req_id: str) -> str:
        """Determine requirement priority from context."""
        # Look for Must/Should/Could keywords near the requirement
        context_window = 500
        idx = content.find(req_id)
        if idx == -1:
            return "Must"
        
        context = content[max(0, idx-context_window):idx+context_window].lower()
        
        if 'must' in context or 'required' in context or 'critical' in context:
            return "Must"
        elif 'should' in context or 'recommended' in context:
            return "Should"
        elif 'could' in context or 'optional' in context or 'nice to have' in context:
            return "Could"
        else:
            return "Must"  # Default to Must
    
    def search_code_for_requirement(self, req_id: str) -> Tuple[List[str], List[str], List[str]]:
        """Search codebase for requirement ID mentions."""
        backend_files = []
        frontend_files = []
        test_files = []
        
        # Use ripgrep if available, otherwise fallback to grep
        try:
            # Try ripgrep first (faster)
            result = subprocess.run(
                ['rg', '-l', req_id, str(self.repo_path)],
                capture_output=True,
                text=True,
                timeout=30
            )
            files = result.stdout.strip().split('\n') if result.returncode == 0 else []
        except (FileNotFoundError, subprocess.TimeoutExpired):
            # Fallback to grep
            try:
                result = subprocess.run(
                    ['grep', '-r', '-l', req_id, str(self.repo_path)],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                files = result.stdout.strip().split('\n') if result.returncode == 0 else []
            except (FileNotFoundError, subprocess.TimeoutExpired):
                # Manual search as last resort
                files = self._manual_search(req_id)
        
        # Categorize files
        for file in files:
            if not file or file == '':
                continue
            
            file_lower = file.lower()
            
            if 'test' in file_lower or 'spec' in file_lower:
                test_files.append(file)
            elif any(ext in file_lower for ext in ['.java', '.kt', '.py', '.go']):
                backend_files.append(file)
            elif any(ext in file_lower for ext in ['.tsx', '.jsx', '.ts', '.js', '.vue']):
                frontend_files.append(file)
            elif 'src/main' in file or 'backend' in file_lower:
                backend_files.append(file)
            elif 'frontend' in file_lower or 'client' in file_lower:
                frontend_files.append(file)
        
        return backend_files, frontend_files, test_files
    
    def _manual_search(self, req_id: str) -> List[str]:
        """Manual recursive search for requirement ID."""
        matching_files = []
        
        for root, dirs, files in os.walk(self.repo_path):
            # Skip common ignore directories
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '.venv', '__pycache__', 'target', 'build', 'dist']]
            
            for file in files:
                filepath = Path(root) / file
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        if req_id in f.read():
                            matching_files.append(str(filepath.relative_to(self.repo_path)))
                except:
                    pass
        
        return matching_files
    
    def search_git_commits(self, req_id: str) -> List[str]:
        """Search git commit messages for requirement ID."""
        try:
            result = subprocess.run(
                ['git', 'log', '--all', '--grep', req_id, '--oneline'],
                capture_output=True,
                text=True,
                cwd=self.repo_path,
                timeout=10
            )
            
            if result.returncode == 0 and result.stdout:
                commits = result.stdout.strip().split('\n')
                return [c for c in commits if c]
            
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
        
        return []
    
    def determine_status(self, backend: List[str], frontend: List[str], 
                        tests: List[str], priority: str) -> str:
        """Determine implementation status based on found files."""
        has_backend = len(backend) > 0
        has_frontend = len(frontend) > 0
        has_tests = len(tests) > 0
        
        if priority == "Must":
            # Must requirements need backend + frontend + tests
            if has_backend and has_frontend and has_tests:
                return "complete"
            elif has_backend or has_frontend:
                return "partial"
            else:
                return "missing"
        
        elif priority == "Should":
            # Should requirements need at least backend or frontend
            if has_backend or has_frontend:
                return "complete"
            else:
                return "missing"
        
        else:  # Could
            # Could requirements are optional
            if has_backend or has_frontend:
                return "complete"
            else:
                return "missing"
    
    def analyze(self, req_file: str = "requirements.md") -> List[RequirementTrace]:
        """Perform complete traceability analysis."""
        print(f"\n🔍 Analyzing Requirements Traceability in {self.repo_path}")
        print("=" * 70)
        
        # Parse requirements
        self.requirements = self.parse_requirements(req_file)
        
        if not self.requirements:
            print("❌ No requirements found. Exiting.")
            return []
        
        # Analyze each requirement
        traces = []
        for req in self.requirements:
            req_id = req['id']
            print(f"\n📋 Analyzing {req_id}: {req['title'][:50]}...")
            
            # Search codebase
            backend, frontend, tests = self.search_code_for_requirement(req_id)
            
            # Search git history
            commits = self.search_git_commits(req_id)
            
            # Determine status
            status = self.determine_status(backend, frontend, tests, req['priority'])
            
            # Generate notes
            notes = self._generate_notes(backend, frontend, tests, commits, status)
            
            trace = RequirementTrace(
                req_id=req_id,
                title=req['title'],
                priority=req['priority'],
                backend_files=backend,
                frontend_files=frontend,
                test_files=tests,
                git_commits=commits,
                status=status,
                notes=notes
            )
            
            traces.append(trace)
            
            # Print summary
            status_emoji = "✅" if status == "complete" else "⚠️" if status == "partial" else "❌"
            print(f"  {status_emoji} Status: {status}")
            print(f"  📁 Backend: {len(backend)} files")
            print(f"  🎨 Frontend: {len(frontend)} files")
            print(f"  🧪 Tests: {len(tests)} files")
            print(f"  📝 Commits: {len(commits)}")
        
        self.traces = traces
        return traces
    
    def _generate_notes(self, backend: List[str], frontend: List[str], 
                       tests: List[str], commits: List[str], status: str) -> str:
        """Generate notes about implementation status."""
        notes = []
        
        if status == "missing":
            notes.append("Not implemented")
        elif status == "partial":
            if not backend:
                notes.append("Backend missing")
            if not frontend:
                notes.append("Frontend missing")
            if not tests:
                notes.append("Tests missing")
        elif status == "complete":
            if not tests:
                notes.append("Consider adding tests")
        
        if len(commits) > 0:
            notes.append(f"Mentioned in {len(commits)} commits")
        
        return "; ".join(notes) if notes else "Implementation found"
    
    def generate_report(self, output_file: str = "traceability_report.md") -> str:
        """Generate markdown report of traceability analysis."""
        if not self.traces:
            return ""
        
        # Calculate statistics
        total = len(self.traces)
        must_reqs = [t for t in self.traces if t.priority == "Must"]
        should_reqs = [t for t in self.traces if t.priority == "Should"]
        
        complete = len([t for t in self.traces if t.status == "complete"])
        partial = len([t for t in self.traces if t.status == "partial"])
        missing = len([t for t in self.traces if t.status == "missing"])
        
        must_complete = len([t for t in must_reqs if t.status == "complete"])
        should_complete = len([t for t in should_reqs if t.status == "complete"])
        
        must_rate = (must_complete / len(must_reqs) * 100) if must_reqs else 0
        overall_rate = (complete / total * 100) if total else 0
        
        # Generate report
        report = f"""# Requirements Traceability Analysis Report

**Generated**: {self._get_timestamp()}  
**Repository**: {self.repo_path}

## Executive Summary

- **Total Requirements**: {total}
- **Must-Have**: {len(must_reqs)}
- **Should-Have**: {len(should_reqs)}
- **Could-Have**: {len([t for t in self.traces if t.priority == "Could"])}

### Implementation Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Complete | {complete} | {complete/total*100:.1f}% |
| ⚠️ Partial | {partial} | {partial/total*100:.1f}% |
| ❌ Missing | {missing} | {missing/total*100:.1f}% |

### Priority Analysis

- **Must-Have Implementation Rate**: {must_rate:.1f}% ({must_complete}/{len(must_reqs)})
- **Should-Have Implementation Rate**: {(should_complete/len(should_reqs)*100) if should_reqs else 0:.1f}%
- **Overall Implementation Rate**: {overall_rate:.1f}%

### Assessment

"""
        
        if must_rate == 100:
            report += "🟢 **PASS**: All Must requirements implemented\n\n"
        elif must_rate >= 80:
            report += "🟡 **PARTIAL**: 80%+ Must requirements, some gaps remain\n\n"
        else:
            report += "🔴 **FAIL**: <80% Must requirements implemented\n\n"
        
        # Detailed table
        report += """## Detailed Traceability Matrix

| Req ID | Title | Priority | Status | Backend | Frontend | Tests | Notes |
|--------|-------|----------|--------|---------|----------|-------|-------|
"""
        
        for trace in self.traces:
            status_emoji = "✅" if trace.status == "complete" else "⚠️" if trace.status == "partial" else "❌"
            report += f"| {trace.req_id} | {trace.title[:40]} | {trace.priority} | {status_emoji} {trace.status} | {len(trace.backend_files)} | {len(trace.frontend_files)} | {len(trace.test_files)} | {trace.notes} |\n"
        
        # Missing/Partial requirements
        issues = [t for t in self.traces if t.status in ["partial", "missing"]]
        if issues:
            report += f"\n## Issues Found ({len(issues)})\n\n"
            
            for trace in issues:
                report += f"### {trace.req_id}: {trace.title}\n\n"
                report += f"- **Priority**: {trace.priority}\n"
                report += f"- **Status**: {trace.status}\n"
                report += f"- **Backend files**: {len(trace.backend_files)}\n"
                report += f"- **Frontend files**: {len(trace.frontend_files)}\n"
                report += f"- **Test files**: {len(trace.test_files)}\n"
                report += f"- **Notes**: {trace.notes}\n\n"
                
                if trace.status == "missing":
                    report += "**Action**: Implementation required\n\n"
                elif trace.status == "partial":
                    report += "**Action**: Complete missing components\n\n"
        
        # Save report
        output_path = self.repo_path / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n✅ Report saved to: {output_path}")
        return report
    
    def export_json(self, output_file: str = "traceability_data.json"):
        """Export traceability data as JSON."""
        data = {
            'repository': str(self.repo_path),
            'timestamp': self._get_timestamp(),
            'summary': {
                'total': len(self.traces),
                'complete': len([t for t in self.traces if t.status == "complete"]),
                'partial': len([t for t in self.traces if t.status == "partial"]),
                'missing': len([t for t in self.traces if t.status == "missing"])
            },
            'traces': [asdict(t) for t in self.traces]
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
    """Main entry point for the script."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Analyze requirements traceability in a codebase'
    )
    parser.add_argument(
        'repo_path',
        nargs='?',
        default='.',
        help='Path to repository (default: current directory)'
    )
    parser.add_argument(
        '--requirements',
        default='requirements.md',
        help='Path to requirements file (default: requirements.md)'
    )
    parser.add_argument(
        '--output',
        default='traceability_report.md',
        help='Output report file (default: traceability_report.md)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Also export JSON data'
    )
    
    args = parser.parse_args()
    
    analyzer = TraceabilityAnalyzer(args.repo_path)
    traces = analyzer.analyze(args.requirements)
    
    if traces:
        analyzer.generate_report(args.output)
        
        if args.json:
            analyzer.export_json()
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 SUMMARY")
        print("=" * 70)
        complete = len([t for t in traces if t.status == "complete"])
        partial = len([t for t in traces if t.status == "partial"])
        missing = len([t for t in traces if t.status == "missing"])
        
        print(f"✅ Complete: {complete}/{len(traces)} ({complete/len(traces)*100:.1f}%)")
        print(f"⚠️  Partial: {partial}/{len(traces)} ({partial/len(traces)*100:.1f}%)")
        print(f"❌ Missing: {missing}/{len(traces)} ({missing/len(traces)*100:.1f}%)")
        
        must_reqs = [t for t in traces if t.priority == "Must"]
        must_complete = len([t for t in must_reqs if t.status == "complete"])
        print(f"\n🎯 Must-Have: {must_complete}/{len(must_reqs)} ({must_complete/len(must_reqs)*100:.1f}%)")
    else:
        print("\n❌ Analysis failed. Check that requirements.md exists.")
        sys.exit(1)


if __name__ == '__main__':
    main()
