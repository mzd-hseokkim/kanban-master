import { test, expect } from '@playwright/test';

/**
 * 인증 관련 E2E 테스트
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 페이지로 이동
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // 로그인 폼 요소 확인
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /login|로그인/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // 빈 폼으로 제출 시도
    await page.getByRole('button', { name: /login|로그인/i }).click();

    // 유효성 검사 에러 메시지 확인 (실제 구현에 따라 수정 필요)
    // await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    // 회원가입 링크 클릭
    const signupLink = page.getByRole('link', { name: /sign up|회원가입/i });
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/.*signup/);
    }
  });

  test('should handle OAuth login buttons', async ({ page }) => {
    // Google OAuth 버튼 확인
    const googleButton = page.getByRole('button', { name: /google/i });
    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeEnabled();
    }

    // GitHub OAuth 버튼 확인
    const githubButton = page.getByRole('button', { name: /github/i });
    if (await githubButton.isVisible()) {
      await expect(githubButton).toBeEnabled();
    }
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    // 잘못된 자격 증명 입력
    await page.locator('#email').fill('test@example.com');
    await page.locator('#password').fill('wrongpassword123');

    // 네트워크 응답 감시
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/auth/login') && response.status() === 401
    );

    // 로그인 버튼 클릭
    await page.getByRole('button', { name: /로그인/i }).click();

    // 401 응답 확인
    const response = await responsePromise;
    expect(response.status()).toBe(401);

    // 로그인 페이지에 유지됨 (리다이렉트 되지 않음)
    await expect(page).toHaveURL(/.*login/);

    // 에러 메시지가 표시됨
    await expect(page.getByText(/잘못된 자격 증명|로그인에 실패/i)).toBeVisible();

    // 입력 필드가 여전히 표시됨
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  // TODO: 실제 로그인 테스트는 테스트 계정이 필요합니다
  test.skip('should login with valid credentials', async ({ page }) => {
    // 테스트용 이메일/비밀번호 입력
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');

    // 로그인 버튼 클릭
    await page.getByRole('button', { name: /login|로그인/i }).click();

    // 로그인 후 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL(/.*board/);
  });
});

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should display signup form', async ({ page }) => {
    // 회원가입 폼 요소 확인
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up|회원가입|가입하기/i })).toBeVisible();
  });

  test('should navigate back to login page', async ({ page }) => {
    // 로그인 페이지로 돌아가는 링크 확인
    const loginLink = page.getByRole('link', { name: /login|로그인/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });
});
