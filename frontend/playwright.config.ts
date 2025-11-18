import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 테스트 파일 위치
  testDir: './e2e',

  // 전체 테스트 타임아웃 (30초)
  timeout: 30 * 1000,

  // 각 expect 타임아웃 (5초)
  expect: {
    timeout: 5000
  },

  // 테스트 실행 설정
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // 모든 테스트에 공통 설정
  use: {
    // 기본 URL (개발 서버)
    baseURL: 'http://localhost:3000',

    // 스크린샷: 실패 시에만
    screenshot: 'only-on-failure',

    // 비디오: 실패 시에만
    video: 'retain-on-failure',

    // 트레이스: 실패 시에만
    trace: 'on-first-retry',

    // 뷰포트 크기
    viewport: { width: 1280, height: 720 },

    // 네비게이션 타임아웃
    navigationTimeout: 10000,

    // 액션 타임아웃
    actionTimeout: 5000
  },

  // 프로젝트별 브라우저 설정
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 추가 브라우저 테스트가 필요한 경우 주석 해제
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // 모바일 테스트
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // 개발 서버 설정 (테스트 실행 시 자동으로 서버 시작)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
