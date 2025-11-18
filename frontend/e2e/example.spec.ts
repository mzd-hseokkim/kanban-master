import { test, expect } from '@playwright/test';

/**
 * 예제 E2E 테스트
 * 이 파일은 Playwright 테스트 환경 설정을 검증하기 위한 샘플입니다.
 */

test.describe('Example E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    // 홈페이지로 이동
    await page.goto('/');

    // 페이지가 정상적으로 로드되었는지 확인
    await expect(page).toHaveTitle(/Kanban/i);
  });

  test('should have a login page', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/login');

    // 로그인 관련 요소가 있는지 확인
    await expect(page.locator('h1, h2, [role="heading"]')).toBeVisible();
  });
});
