# my:implement - 스펙 문서 기반 체계적 구현

요구사항 및 스펙 문서를 단일 진실 소스(SSOT)로 사용하여 체계적으로 기능을 구현합니다.

## 사용법

```
/my:implement [document-name] [priority]
```

## 파라미터

- `document-name`: 구현할 문서의 이름 (필수)
- `priority`: 우선순위 (선택, 기본값: Priority-3)
  - 가능한 값: Priority-1, Priority-2, Priority-3

## 구현 원칙

1. **단일 진실 소스(SSOT)**: 스펙 문서가 모든 구현 결정의 기준입니다.
2. **근거 기반 결정**: 모든 코드 결정은 스펙의 조항을 인용합니다.
3. **환경 명확화**: Framework, 언어 버전, 라이브러리를 사전에 확인합니다.
4. **구조 우선 설계**: 코드 작성 전에 파일/모듈/엔드포인트 구조를 계획합니다.
5. **모호성 질문**: 불명확한 부분은 반드시 질문하고, 임의 추론을 금지합니다.
6. **E2E 우선**: 스펙(E2E)을 먼저 구현하고, 내부 구현은 그 다음입니다.
7. **SOLID 원칙**: 과도한 엔지니어링 없이 SOLID 원칙을 준수합니다.
8. **검증 체크리스트**: 구현 완료 후 검증 체크리스트를 작성합니다.

## 작동 방식

1. **문서 로드**: 해당 priority의 requirement와 spec 문서를 찾아 읽습니다.
2. **환경 분석**: 프로젝트의 기술 스택과 의존성을 확인합니다.
3. **구조 설계**: 파일 구조, 모듈 구조, API 엔드포인트를 계획합니다.
4. **단계별 구현**: spec의 구현 순서(Phase)를 따라 진행합니다.
5. **검증**: 수용 기준과 테스트 전략에 따라 검증합니다.

## 예시

```bash
# Priority-2 문서 기반 구현
/my:implement card-description-html-editor Priority-2

# Priority 미지정 (기본값 Priority-3 사용)
/my:implement user-notifications
```

---

## 실행 프롬프트

다음 단계를 순차적으로 수행합니다:

### Phase 1: 문서 로드 및 분석

1. **문서 찾기**
   - `$ARGUMENTS`에서 document-name과 priority를 추출합니다
   - priority가 없으면 "Priority-3"을 기본값으로 사용합니다
   - 다음 문서를 읽습니다:
     - `docs/requirements/[priority]/[document-name].md`
     - `docs/specs/[priority]/spec-[document-name].md`
   - 문서가 없으면 사용자에게 알리고 중단합니다

2. **요구사항 파악**
   - Requirement 문서에서 다음을 추출합니다:
     - 목적 및 범위
     - 기능 요구사항 (FR-XXX)
     - 비기능 요구사항 (NFR-XXX)
     - 제약사항 및 가정
   - Spec 문서에서 다음을 추출합니다:
     - 주요 사용자 시나리오
     - 프론트엔드 규격 (컴포넌트, 상태 관리)
     - 백엔드 규격 (API, DTO, 서비스)
     - 수용 기준
     - 구현 순서 (Phase)

3. **모호성 확인**
   - 스펙에서 명확하지 않은 부분이 있는지 검토합니다
   - 다음 항목에 대해 특히 주의합니다:
     - 정의되지 않은 데이터 타입
     - 명시되지 않은 에러 처리 방식
     - 불명확한 비즈니스 로직
     - 누락된 엣지 케이스
   - **모호한 부분이 있으면 반드시 사용자에게 질문하고 대기합니다**
   - 임의로 추론하지 않습니다

### Phase 2: 환경 및 의존성 확인

1. **기술 스택 확인**
   - Backend:
     - `backend/build.gradle.kts` 읽기 (Java 버전, Spring Boot 버전, 의존성)
     - 프로젝트 구조 파악
   - Frontend:
     - `frontend/package.json` 읽기 (Node 버전, React 버전, 의존성)
     - 프로젝트 구조 파악

2. **추가 의존성 식별**
   - Spec에서 요구하는 새로운 라이브러리를 확인합니다
   - 버전 호환성을 검토합니다
   - 라이선스를 확인합니다

3. **환경 설정 확인**
   - Backend: `application.yml`, `application-dev.yml` 등
   - Frontend: `.env`, `vite.config.ts` 등

### Phase 3: 구조 설계

1. **파일 구조 계획**
   - Backend:
     - Controller, Service, Repository, DTO, Entity 파일 목록
     - 패키지 구조
   - Frontend:
     - 컴포넌트 파일 목록
     - Hook, Service, Type 파일 목록
     - 디렉토리 구조

2. **모듈 구조 설계**
   - Backend:
     - 레이어별 역할 정의 (Controller → Service → Repository)
     - DTO 변환 흐름
   - Frontend:
     - 컴포넌트 계층 구조
     - 상태 관리 플로우
     - API 호출 패턴

3. **API 엔드포인트 목록**
   - Spec에서 정의된 모든 엔드포인트를 나열합니다
   - HTTP 메서드, 경로, 요청/응답 형식
   - 인증/인가 요구사항

4. **구조 설계 문서 작성**
   - 위 내용을 마크다운 형식으로 정리합니다
   - 사용자에게 보여주고 승인을 받습니다
   - **승인 전까지 코드 작성을 시작하지 않습니다**

### Phase 4: 단계별 구현

1. **구현 순서 준수**
   - Spec 문서의 "구현 순서" 섹션을 따릅니다
   - 각 Phase를 순차적으로 진행합니다
   - TodoWrite를 사용하여 진행 상황을 추적합니다

2. **E2E 우선 구현**
   - API 엔드포인트 → Service 인터페이스 → 구현 순서로 진행합니다
   - 프론트엔드: 컴포넌트 인터페이스 → UI → 내부 로직 순서로 진행합니다
   - 외부에서 내부로 진행합니다

3. **SOLID 원칙 적용**
   - Single Responsibility: 클래스/함수는 하나의 책임만 가집니다
   - Open/Closed: 확장에는 열려있고 수정에는 닫혀있습니다
   - Liskov Substitution: 상속 관계에서 치환 가능성을 보장합니다
   - Interface Segregation: 클라이언트는 사용하지 않는 인터페이스에 의존하지 않습니다
   - Dependency Inversion: 추상화에 의존하고 구체화에 의존하지 않습니다
   - **단, 과도한 추상화는 피합니다**

4. **스펙 근거 인용**
   - 모든 중요한 코드 결정에 대해 주석으로 스펙 조항을 인용합니다
   - 예시:
     ```java
     // Spec § 6. 백엔드 규격 - HTML Sanitization
     // FR-05g: XSS 방지를 위해 OWASP HTML Sanitizer 사용
     private String sanitizeHtml(String html) {
         if (html == null || html.isBlank()) {
             return null;
         }
         return htmlSanitizerPolicy.sanitize(html);
     }
     ```

5. **코드 작성 시 주의사항**
   - 기존 프로젝트의 코딩 스타일을 따릅니다
   - 기존 컴포넌트/서비스 패턴을 재사용합니다
   - 에러 처리를 누락하지 않습니다
   - 로깅을 적절히 추가합니다

### Phase 5: 테스트 구현

1. **테스트 전략 준수**
   - Spec 문서의 "테스트 전략" 섹션을 따릅니다
   - Backend: Unit Tests, Integration Tests
   - Frontend: Component Tests, Integration Tests, E2E Tests

2. **수용 기준 검증**
   - Spec 문서의 "수용 기준"을 테스트로 변환합니다
   - 모든 수용 기준이 테스트로 커버되어야 합니다

3. **엣지 케이스 테스트**
   - 정상 플로우뿐만 아니라 예외 상황도 테스트합니다
   - null, empty, 경계값, 에러 상황 등

### Phase 6: 검증 및 체크리스트

1. **검증 체크리스트 작성**
   - 다음 항목을 포함한 체크리스트를 생성합니다:

   **기능 검증**:
   - [ ] 모든 기능 요구사항(FR-XXX)이 구현되었는가?
   - [ ] 모든 비기능 요구사항(NFR-XXX)이 충족되었는가?
   - [ ] 모든 수용 기준을 통과하는가?
   - [ ] 주요 사용자 시나리오가 동작하는가?

   **코드 품질**:
   - [ ] SOLID 원칙을 준수하는가?
   - [ ] 기존 프로젝트 패턴과 일관성이 있는가?
   - [ ] 에러 처리가 적절한가?
   - [ ] 로깅이 적절한가?
   - [ ] 주석이 필요한 곳에 작성되었는가?

   **테스트**:
   - [ ] Unit Tests가 작성되었는가? (커버리지 80% 이상)
   - [ ] Integration Tests가 작성되었는가?
   - [ ] E2E Tests가 작성되었는가? (주요 플로우)
   - [ ] 모든 테스트가 통과하는가?

   **보안**:
   - [ ] 입력 검증이 적절한가?
   - [ ] XSS, SQL Injection 등 보안 취약점이 없는가?
   - [ ] 인증/인가가 적절히 구현되었는가?
   - [ ] 민감 정보가 로그에 노출되지 않는가?

   **성능**:
   - [ ] 성능 목표를 충족하는가?
   - [ ] N+1 쿼리 문제가 없는가?
   - [ ] 불필요한 리렌더링이 없는가?
   - [ ] 번들 사이즈가 적절한가?

   **문서화**:
   - [ ] API 문서가 업데이트되었는가?
   - [ ] README가 필요하면 업데이트되었는가?
   - [ ] CHANGELOG가 업데이트되었는가?

2. **자동 검증 실행**
   - Backend:
     ```bash
     ./gradlew clean build test
     ```
   - Frontend:
     ```bash
     npm run typecheck
     npm run lint
     npm run test
     npm run build
     ```

3. **검증 결과 보고**
   - 체크리스트 각 항목의 상태를 보고합니다
   - 통과하지 못한 항목이 있으면 수정 계획을 제시합니다

### Phase 7: 최종 보고

1. **구현 요약**
   - 구현된 파일 목록 (경로 포함)
   - 추가/수정된 주요 기능
   - 새로 추가된 의존성

2. **스펙 준수 확인**
   - 각 기능 요구사항(FR-XXX)의 구현 여부
   - 각 비기능 요구사항(NFR-XXX)의 충족 여부
   - 수용 기준 달성 여부

3. **다음 단계 제안**
   - 수동 테스트가 필요한 부분
   - 추가 개선 제안
   - 문서화 작업

## 중요 원칙 재확인

- **절대 임의 추론 금지**: 모호한 부분은 반드시 질문합니다
- **스펙이 SSOT**: 모든 결정은 스펙 문서에 근거합니다
- **구조 우선**: 코드 작성 전에 반드시 구조 설계를 완료하고 승인받습니다
- **E2E 우선**: 외부 인터페이스부터 구현하고 내부로 진행합니다
- **검증 필수**: 구현 후 반드시 체크리스트 기반 검증을 수행합니다
