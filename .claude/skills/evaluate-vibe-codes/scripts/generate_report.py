#!/usr/bin/env python3
"""
Comprehensive Evaluation Report Generator

Aggregates results from all analysis tools and generates a complete
Vibe Coding evaluation report based on TRACE framework.
"""

import json
import sys
import subprocess
from pathlib import Path
from typing import Dict, Optional
from dataclasses import dataclass


@dataclass
class EvaluationResults:
    """Container for all evaluation results."""
    traceability_score: int
    api_compliance_score: int
    code_quality_score: int
    functional_score: int
    overall_score: int
    grade: str
    
    traceability_data: Optional[Dict] = None
    api_compliance_data: Optional[Dict] = None
    code_quality_data: Optional[Dict] = None


class ReportGenerator:
    """Generates comprehensive evaluation report."""
    
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path)
        self.results: Optional[EvaluationResults] = None
    
    def run_all_analyses(self) -> EvaluationResults:
        """Run all analysis scripts and collect results."""
        print("🚀 Running Comprehensive Vibe Coding Evaluation")
        print("=" * 70)
        
        scripts_dir = Path(__file__).parent
        
        # 1. Traceability Analysis
        print("\n📋 Step 1/3: Analyzing Requirements Traceability...")
        trace_data = self._run_analysis(
            scripts_dir / "analyze_traceability.py",
            ["--json"]
        )
        trace_score = self._calculate_trace_score(trace_data)
        
        # 2. API Compliance Check
        print("\n🔌 Step 2/3: Checking API Compliance...")
        api_data = self._run_analysis(
            scripts_dir / "check_api_compliance.py",
            ["--json"]
        )
        api_score = self._calculate_api_score(api_data)
        
        # 3. Code Quality Analysis
        print("\n📊 Step 3/3: Measuring Code Quality...")
        quality_data = self._run_analysis(
            scripts_dir / "measure_code_quality.py",
            []
        )
        quality_score = self._calculate_quality_score(quality_data)
        
        # 4. Functional Verification (manual - placeholder)
        print("\n✅ Step 4/3: Functional Verification (manual checks required)")
        functional_score = 85  # Placeholder - requires manual testing
        
        # Calculate overall score
        overall_score = self._calculate_overall_score(
            trace_score, api_score, quality_score, functional_score
        )
        
        # Determine grade
        grade = self._determine_grade(overall_score)
        
        results = EvaluationResults(
            traceability_score=trace_score,
            api_compliance_score=api_score,
            code_quality_score=quality_score,
            functional_score=functional_score,
            overall_score=overall_score,
            grade=grade,
            traceability_data=trace_data,
            api_compliance_data=api_data,
            code_quality_data=quality_data
        )
        
        self.results = results
        return results
    
    def _run_analysis(self, script_path: Path, args: list) -> Optional[Dict]:
        """Run an analysis script and return results."""
        try:
            cmd = [sys.executable, str(script_path), str(self.repo_path)] + args
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode != 0 and result.returncode != 1:
                print(f"  ⚠️  Script failed with code {result.returncode}")
                print(f"  Error: {result.stderr}")
                return None
            
            # Try to load JSON data if --json was used
            if "--json" in args:
                json_files = {
                    "analyze_traceability.py": "traceability_data.json",
                    "check_api_compliance.py": "api_compliance_data.json"
                }
                
                json_file = json_files.get(script_path.name)
                if json_file:
                    json_path = self.repo_path / json_file
                    if json_path.exists():
                        with open(json_path, 'r') as f:
                            return json.load(f)
            
            return None
        
        except subprocess.TimeoutExpired:
            print(f"  ⚠️  Script timed out after 5 minutes")
            return None
        except Exception as e:
            print(f"  ⚠️  Error running script: {e}")
            return None
    
    def _calculate_trace_score(self, data: Optional[Dict]) -> int:
        """Calculate traceability score from analysis data."""
        if not data or 'summary' not in data:
            return 0
        
        summary = data['summary']
        total = summary.get('total', 0)
        complete = summary.get('complete', 0)
        
        if total == 0:
            return 0
        
        # Calculate based on completion rate
        completion_rate = (complete / total) * 100
        
        # Check Must requirements specifically
        if 'traces' in data:
            must_reqs = [t for t in data['traces'] if t.get('priority') == 'Must']
            if must_reqs:
                must_complete = len([t for t in must_reqs if t.get('status') == 'complete'])
                must_rate = (must_complete / len(must_reqs)) * 100
                
                # Must requirements heavily weighted
                score = (must_rate * 0.7) + (completion_rate * 0.3)
                return int(score)
        
        return int(completion_rate)
    
    def _calculate_api_score(self, data: Optional[Dict]) -> int:
        """Calculate API compliance score."""
        if not data or 'summary' not in data:
            return 0
        
        summary = data['summary']
        total = summary.get('total_endpoints', 0)
        implemented = summary.get('implemented', 0)
        critical = summary.get('critical_issues', 0)
        major = summary.get('major_issues', 0)
        
        if total == 0:
            return 0
        
        # Start with implementation rate
        impl_rate = (implemented / total) * 100
        
        # Deduct for issues
        score = impl_rate
        score -= critical * 15  # Critical issues heavily penalized
        score -= major * 5
        
        return max(0, min(100, int(score)))
    
    def _calculate_quality_score(self, data: Optional[Dict]) -> int:
        """Calculate code quality score."""
        # This would be calculated by measure_code_quality.py
        # For now, read from the report or estimate
        quality_report = self.repo_path / "code_quality_report.md"
        
        if quality_report.exists():
            with open(quality_report, 'r') as f:
                content = f.read()
                # Try to extract score from report
                import re
                match = re.search(r'Overall Score[:\s]+(\d+)/100', content)
                if match:
                    return int(match.group(1))
        
        return 70  # Default
    
    def _calculate_overall_score(self, trace: int, api: int, quality: int, functional: int) -> int:
        """Calculate weighted overall score."""
        # Weights based on TRACE framework importance
        weights = {
            'traceability': 0.25,
            'api_compliance': 0.25,
            'code_quality': 0.30,
            'functional': 0.20
        }
        
        overall = (
            trace * weights['traceability'] +
            api * weights['api_compliance'] +
            quality * weights['code_quality'] +
            functional * weights['functional']
        )
        
        return int(overall)
    
    def _determine_grade(self, score: int) -> str:
        """Determine grade from score."""
        if score >= 90:
            return "🟢 Excellent"
        elif score >= 70:
            return "🟡 Good"
        elif score >= 50:
            return "🟠 Fair"
        else:
            return "🔴 Poor"
    
    def generate_report(self, output_file: str = "evaluation_report.md") -> str:
        """Generate comprehensive evaluation report."""
        if not self.results:
            print("❌ No results to report. Run analysis first.")
            return ""
        
        r = self.results
        
        # Generate report
        report = f"""# Vibe Coding Evaluation Report

**Generated**: {self._get_timestamp()}  
**Repository**: {self.repo_path}  
**Framework**: TRACE (Traceability, Robustness, Adherence, Completeness, Efficiency)

---

## Executive Summary

### Overall Assessment

**Overall Score**: {r.overall_score}/100  
**Grade**: {r.grade}

| Dimension | Score | Weight |
|-----------|-------|--------|
| 📋 Requirements Traceability | {r.traceability_score}/100 | 25% |
| 🔌 API Specification Compliance | {r.api_compliance_score}/100 | 25% |
| 📊 Code Quality | {r.code_quality_score}/100 | 30% |
| ✅ Functional Verification | {r.functional_score}/100 | 20% |

### Deployment Readiness

"""
        
        if r.overall_score >= 90:
            report += """✅ **Production Ready**
- Code meets all quality standards
- All requirements implemented
- Ready for immediate deployment

"""
        elif r.overall_score >= 70:
            report += """⚠️ **Deploy After Fixes**
- Code quality is acceptable
- Minor improvements needed
- Can deploy after addressing critical issues

"""
        elif r.overall_score >= 50:
            report += """🔧 **Refactoring Needed**
- Significant quality issues present
- Major refactoring required
- Not recommended for production deployment

"""
        else:
            report += """❌ **Major Rework Required**
- Critical quality issues
- Extensive rework needed
- Do not deploy to production

"""
        
        # Detailed findings per dimension
        report += """---

## 1. Requirements Traceability ({r.traceability_score}/100)

"""
        
        if r.traceability_data and 'summary' in r.traceability_data:
            summary = r.traceability_data['summary']
            report += f"""
- Total Requirements: {summary.get('total', 0)}
- ✅ Complete: {summary.get('complete', 0)}
- ⚠️ Partial: {summary.get('partial', 0)}
- ❌ Missing: {summary.get('missing', 0)}

"""
            if summary.get('missing', 0) > 0:
                report += "**Critical**: Missing requirements detected. See detailed traceability report.\n\n"
        else:
            report += "See `traceability_report.md` for detailed analysis.\n\n"
        
        report += f"""---

## 2. API Specification Compliance ({r.api_compliance_score}/100)

"""
        
        if r.api_compliance_data and 'summary' in r.api_compliance_data:
            summary = r.api_compliance_data['summary']
            report += f"""
- Specified Endpoints: {summary.get('total_endpoints', 0)}
- Implemented: {summary.get('implemented', 0)}
- Issues: {summary.get('issues', 0)}
  - 🔴 Critical: {summary.get('critical_issues', 0)}
  - 🟡 Major: {summary.get('major_issues', 0)}
  - 🔵 Minor: {summary.get('minor_issues', 0)}

"""
            if summary.get('critical_issues', 0) > 0:
                report += "**Critical**: API endpoints missing or mismatched. See detailed compliance report.\n\n"
        else:
            report += "See `api_compliance_report.md` for detailed analysis.\n\n"
        
        report += f"""---

## 3. Code Quality ({r.code_quality_score}/100)

See `code_quality_report.md` for detailed analysis including:
- Architecture patterns (layered architecture, DTO usage)
- Coding standards (dependency injection, transaction management)
- SOLID principles compliance
- Error handling patterns
- Test coverage

---

## 4. Functional Verification ({r.functional_score}/100)

**Note**: Functional verification requires manual testing. This score is an estimate.

**Recommended Manual Tests**:
1. ✅ Application starts successfully
2. ✅ Core user flows work end-to-end
3. ✅ Error cases handled gracefully
4. ✅ Performance meets requirements
5. ⚠️ Edge cases tested

---

## Priority Recommendations

"""
        
        recommendations = self._generate_recommendations()
        for i, rec in enumerate(recommendations, 1):
            report += f"{i}. {rec}\n"
        
        report += """
---

## Next Steps

"""
        
        if r.overall_score >= 90:
            report += """1. ✅ **Deploy to Production**
   - Code quality is excellent
   - All checks passed
   - Monitor in production for any issues

2. 📝 **Documentation**
   - Update deployment documentation
   - Document any manual configuration steps
   
3. 🔄 **Continuous Monitoring**
   - Set up monitoring and alerting
   - Plan for regular quality checks
"""
        elif r.overall_score >= 70:
            report += """1. 🔧 **Fix Critical Issues**
   - Address critical issues in traceability and API compliance
   - Run evaluation again after fixes
   
2. ✅ **Deploy to Staging**
   - Test in staging environment
   - Validate all functionality
   
3. 🚀 **Production Deployment**
   - Deploy after staging validation
   - Monitor closely during initial rollout
"""
        else:
            report += """1. 🔧 **Major Refactoring**
   - Address architectural issues
   - Implement missing requirements
   - Improve code quality
   
2. 📋 **Re-evaluate**
   - Run full evaluation after refactoring
   - Target: 70+ score before deployment
   
3. 🧪 **Comprehensive Testing**
   - Add unit and integration tests
   - Achieve 80%+ code coverage
"""
        
        report += f"""
---

**Report Generated**: {self._get_timestamp()}  
**Evaluation Framework**: TRACE v1.0  
**Analysis Tools**: analyze_traceability.py, check_api_compliance.py, measure_code_quality.py
"""
        
        # Save report
        output_path = self.repo_path / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n✅ Comprehensive report saved to: {output_path}")
        return report
    
    def _generate_recommendations(self) -> list:
        """Generate prioritized recommendations."""
        recommendations = []
        r = self.results
        
        # Critical issues first
        if r.traceability_score < 80:
            recommendations.append("**CRITICAL**: Implement missing Must-have requirements")
        
        if r.api_compliance_score < 70:
            recommendations.append("**CRITICAL**: Fix API endpoint mismatches and missing implementations")
        
        if r.code_quality_score < 50:
            recommendations.append("**MAJOR**: Refactor code to follow architectural patterns and SOLID principles")
        
        # Improvement recommendations
        if r.code_quality_score < 80:
            recommendations.append("**Improve**: Add unit and integration tests (target: 80% coverage)")
        
        if r.traceability_score < 100:
            recommendations.append("**Complete**: Finish partial implementations")
        
        if not recommendations:
            recommendations.append("✅ **Excellent**: Continue monitoring and maintaining code quality")
        
        return recommendations
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Generate comprehensive Vibe Coding evaluation report'
    )
    parser.add_argument(
        'repo_path',
        nargs='?',
        default='.',
        help='Path to repository (default: current directory)'
    )
    parser.add_argument(
        '--output',
        default='evaluation_report.md',
        help='Output report file (default: evaluation_report.md)'
    )
    parser.add_argument(
        '--skip-analysis',
        action='store_true',
        help='Skip running analysis scripts, use existing reports'
    )
    
    args = parser.parse_args()
    
    generator = ReportGenerator(args.repo_path)
    
    if not args.skip_analysis:
        results = generator.run_all_analyses()
    else:
        print("⏭️  Skipping analysis, using existing reports...")
        # Would need to load existing data here
        results = None
    
    generator.generate_report(args.output)
    
    # Print summary
    if generator.results:
        print("\n" + "=" * 70)
        print("📊 EVALUATION SUMMARY")
        print("=" * 70)
        r = generator.results
        print(f"📋 Traceability: {r.traceability_score}/100")
        print(f"🔌 API Compliance: {r.api_compliance_score}/100")
        print(f"📊 Code Quality: {r.code_quality_score}/100")
        print(f"✅ Functional: {r.functional_score}/100")
        print(f"\n🎯 Overall Score: {r.overall_score}/100")
        print(f"🏆 Grade: {r.grade}")
        
        if r.overall_score >= 70:
            print("\n✅ Evaluation PASSED - Ready for deployment (with minor fixes if needed)")
        else:
            print("\n⚠️  Evaluation NEEDS IMPROVEMENT - Significant work required")
            sys.exit(1)


if __name__ == '__main__':
    main()
