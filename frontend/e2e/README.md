# Playwright E2E 테스트

Kanban Master 프론트엔드 애플리케이션의 End-to-End 테스트 스위트입니다.

## 📋 테스트 파일 구조

```
e2e/
├── README.md                        # 이 파일
├── auth.spec.ts                     # 인증 관련 테스트 (로그인, 회원가입)
├── board.spec.ts                    # 칸반 보드 테스트
├── dashboard-delayed-card.spec.ts   # 대시보드 지연 카드 관리 테스트 ⭐ NEW
└── example.spec.ts                  # 예제 테스트
```

## 🚀 테스트 실행 방법

### 전체 테스트 실행
```bash
npm run test:e2e
```

### 특정 파일만 실행
```bash
# 대시보드 지연 카드 테스트만 실행
npx playwright test dashboard-delayed-card

# 인증 테스트만 실행
npx playwright test auth
```

### UI 모드로 실행 (시각적 디버깅)
```bash
npm run test:e2e:ui
```

### 디버그 모드로 실행
```bash
npm run test:e2e:debug
```

### 특정 브라우저에서만 실행
```bash
# Chrome만
npx playwright test --project=chromium

# Firefox만
npx playwright test --project=firefox

# Safari만
npx playwright test --project=webkit
```

### 테스트 리포트 보기
```bash
npm run test:e2e:report
```

## 📝 주요 테스트 시나리오

### 1. 인증 테스트 (auth.spec.ts)
- ✅ 로그인 폼 표시 확인
- ✅ 빈 폼 제출 시 유효성 검사
- ✅ 잘못된 자격 증명으로 로그인 실패
- ✅ 회원가입 페이지 이동
- ✅ OAuth 버튼 확인

### 2. 대시보드 지연 카드 관리 테스트 (dashboard-delayed-card.spec.ts) ⭐ NEW

#### 메인 시나리오: 지연 카드 마감일 연장 후 목록에서 제거
1. 로그인 페이지 접속
2. 유효한 계정으로 로그인 (team.leader@kanban.com)
3. 대시보드에서 "지연 중인 작업" 섹션 확인
4. 첫 번째 지연 카드("멤버 보기 패널 고도화") 클릭
5. 카드 수정 모달에서 마감일을 1주일 연장 (2025-11-14 → 2025-11-21)
6. 수정 버튼 클릭하여 저장
7. 대시보드로 돌아가서 해당 카드가 "지연 중인 작업" 목록에서 제거되었는지 확인 ✅

#### 추가 테스트 케이스:
- ✅ 카드 상세 정보 확인 (제목, 우선순위, 담당자, 설명)
- ✅ 지연 카드 개수 정확성 검증
- ✅ 카드 수정 취소 기능 (변경사항이 저장되지 않는지 확인)

### 3. 칸반 보드 테스트 (board.spec.ts)
- ✅ 보드 컬럼 표시 확인
- 🚧 카드 생성 (skip)
- 🚧 카드 수정 (skip)
- 🚧 카드 삭제 (skip)
- 🚧 드래그 앤 드롭 (skip)

## 🔧 테스트 환경 설정

### 필수 조건
1. **백엔드 서버 실행**: `http://localhost:8080`
2. **프론트엔드 개발 서버 실행**: `http://localhost:3000`

테스트는 실제 환경에서 실행되므로 두 서버가 모두 실행 중이어야 합니다.

### 테스트 계정
```typescript
const TEST_USER = {
  email: 'team.leader@kanban.com',
  password: 'Kanban!234'
};
```

이 계정은 백엔드 데이터베이스에 존재해야 합니다.

## 📊 테스트 결과

테스트 실행 후 다음 위치에서 결과를 확인할 수 있습니다:

- **HTML 리포트**: `playwright-report/index.html`
- **JSON 결과**: `test-results/results.json`
- **스크린샷** (실패 시): `test-results/` 디렉토리
- **비디오** (실패 시): `test-results/` 디렉토리

## 🎯 CI/CD 통합

GitHub Actions에서 자동으로 실행되도록 설정할 수 있습니다:

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🐛 트러블슈팅

### 1. 브라우저가 설치되지 않았다는 오류
```bash
npx playwright install chromium
```

### 2. 타임아웃 오류
playwright.config.ts에서 타임아웃 값을 증가시키세요:
```typescript
timeout: 60 * 1000, // 60초
```

### 3. 서버 연결 오류
백엔드와 프론트엔드 서버가 모두 실행 중인지 확인하세요:
```bash
# 백엔드 (루트 디렉토리에서)
./gradlew bootRun

# 프론트엔드 (frontend 디렉토리에서)
npm run dev
```

### 4. 테스트 데이터 초기화
테스트 전에 데이터베이스를 알려진 상태로 초기화해야 할 수 있습니다.

## 📚 참고 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test Generator](https://playwright.dev/docs/codegen)

## 🔄 테스트 작성 가이드

### 새로운 테스트 추가하기

1. `e2e/` 디렉토리에 새 `.spec.ts` 파일 생성
2. 기본 구조 작성:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 전 설정
  });

  test('should do something', async ({ page }) => {
    // 테스트 로직
  });
});
```

3. 테스트 실행하여 검증
4. 커밋 전에 모든 테스트가 통과하는지 확인

### 권장 사항

- **명확한 테스트 이름**: 무엇을 테스트하는지 명확하게 작성
- **독립적인 테스트**: 각 테스트는 다른 테스트에 의존하지 않아야 함
- **적절한 대기**: `waitForSelector`, `waitForURL` 등 사용
- **의미 있는 assertion**: 중요한 부분만 검증
- **재사용 가능한 헬퍼**: 공통 로직은 별도 함수로 분리

## ✅ 테스트 체크리스트

새로운 기능 추가 시:
- [ ] 기능에 대한 E2E 테스트 작성
- [ ] 로컬에서 테스트 통과 확인
- [ ] 다른 브라우저에서도 테스트
- [ ] 에러 케이스도 테스트
- [ ] 테스트 문서 업데이트
