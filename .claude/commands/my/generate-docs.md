# my:generate-docs - 요구사항 및 스펙 문서 자동 생성

현재 세션에서 대화된 내용을 기반으로 requirement와 spec 문서를 자동 생성합니다.

## 사용법

```
/my:generate-docs [document-name] [priority]
```

## 파라미터

- `document-name`: 생성할 문서의 이름 (필수)
- `priority`: 우선순위 (선택, 기본값: Priority-3)
  - 가능한 값: Priority-1, Priority-2, Priority-3

## 작동 방식

1. **대화 내용 분석**: 현재 세션의 대화 내용을 분석하여 요구사항과 스펙을 추출합니다.

2. **Requirement 문서 생성**: `docs/requirements/[priority]/[document-name].md`
   - 목적
   - 범위
   - 기능 요구사항 (테이블 형식)
   - UX·인터랙션 요구사항
   - 비기능 요구사항
   - 가정 및 제약
   - 미해결 이슈

3. **Spec 문서 생성**: `docs/specs/[priority]/spec-[document-name].md`
   - 개요
   - 연계 요구사항
   - 주요 사용자 시나리오
   - 디자인 가이드라인
   - 프론트엔드 규격 (컴포넌트 구조, Props, 상태 관리)
   - 백엔드 규격 (API 엔드포인트, DTO, 서비스 로직)
   - 보안 처리
   - 수용 기준
   - 구현 순서
   - 위험 요소 및 완화 전략
   - 테스트 전략
   - Notes
   - Related Documents

## 중요 원칙

- **코드 미포함 원칙**: Spec 문서에는 실제 구현 코드를 포함하지 않습니다.
- **설계 중심**: 인터페이스 정의, 데이터 구조, 플로우 다이어그램 등 설계 관점의 내용만 포함합니다.
- **한국어 작성**: 모든 문서는 한국어로 작성됩니다.

## 예시

```bash
# Priority-2 문서 생성
/my:generate-docs card-tags Priority-2

# Priority 미지정 (기본값 Priority-3 사용)
/my:generate-docs user-notifications
```

---

## 실행 프롬프트

이제 다음 작업을 수행합니다:

1. **대화 컨텍스트 분석**
   - 현재 세션의 모든 대화 내용을 검토합니다
   - 논의된 기능, 요구사항, 제약사항, 설계 방안을 추출합니다
   - 사용자와 합의된 내용을 식별합니다

2. **파라미터 확인**
   - `$ARGUMENTS`에서 document-name과 priority를 추출합니다
   - priority가 없으면 "Priority-3"을 기본값으로 사용합니다

3. **문서 구조 준비**
   - `docs/requirements/Priority-2/card-description-html-editor.md` 형식을 참조합니다
   - `docs/specs/Priority-2/spec-card-description-html-editor.md` 형식을 참조합니다

4. **Requirement 문서 생성**
   - 파일 경로: `docs/requirements/[priority]/[document-name].md`
   - 대화에서 추출한 내용을 바탕으로 다음 섹션을 작성합니다:
     - 목적
     - 범위 (포함/제외)
     - 기능 요구사항 (ID, 제목, 설명, 우선순위 테이블)
     - UX·인터랙션 요구사항
     - 비기능 요구사항 (성능, 신뢰성, 보안, 호환성, 접근성)
     - 가정 및 제약
     - 미해결 이슈

5. **Spec 문서 생성**
   - 파일 경로: `docs/specs/[priority]/spec-[document-name].md`
   - **중요**: 실제 구현 코드를 포함하지 않습니다
   - 다음 섹션을 작성합니다:
     - 개요
     - 연계 요구사항 (FR-XX 목록)
     - 주요 사용자 시나리오 (단계별 플로우)
     - 디자인 가이드라인 (UI 레이아웃, 스타일 가이드)
     - 프론트엔드 규격:
       - 컴포넌트 구조 (Props 인터페이스 정의만, 구현 코드 없음)
       - 상태 관리 방식 설명
       - 패키지 의존성 목록
     - 백엔드 규격:
       - API 엔드포인트 명세 (HTTP 메서드, 경로, 요청/응답 형식)
       - DTO 필드 정의 (타입과 설명만)
       - 서비스 로직 설명 (구현 코드 없이 플로우 설명)
     - 보안 처리 (보안 전략 설명)
     - 수용 기준 (체크리스트)
     - 구현 순서 (Phase별 체크리스트)
     - 위험 요소 및 완화 전략 (테이블 형식)
     - 테스트 전략
     - Notes
     - Related Documents

6. **결과 보고**
   - 생성된 두 문서의 경로를 출력합니다
   - 각 문서의 주요 내용을 간단히 요약합니다 (3-5줄)
   - 추가로 검토가 필요한 부분이 있다면 안내합니다

**중요 제약사항**:
- Spec 문서에는 절대로 실제 Java, TypeScript, SQL 구현 코드를 포함하지 않습니다
- 인터페이스 정의, 타입 선언, API 명세만 포함합니다
- 예시 코드가 필요한 경우 의사코드나 플로우 설명으로 대체합니다
