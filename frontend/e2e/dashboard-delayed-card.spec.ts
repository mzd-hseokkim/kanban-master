import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * 대시보드 지연 카드 관리 E2E 테스트 (자체 완결형)
 *
 * 시나리오:
 * 1. 테스트용 보드, 칼럼, 지연 카드 생성
 * 2. 로그인 페이지 접속 및 로그인
 * 3. 대시보드에서 지연 중인 카드 목록에 테스트 카드 표시 확인
 * 4. 지연 카드 클릭하여 상세 모달 오픈
 * 5. 마감일을 1주일 연장하여 지연 상태 해제
 * 6. 대시보드로 돌아가서 해당 카드가 지연 목록에서 제거되었는지 확인
 * 7. 테스트 데이터 정리 (카드, 보드 삭제)
 */

// 테스트 계정 정보
const TEST_USER = {
  email: 'team.leader@kanban.com',
  password: 'Kanban!234'
};

// API 베이스 URL
const API_BASE_URL = 'http://localhost:8080/api/v1';

// 테스트 데이터 저장용 변수
let testData: {
  workspaceId: number;
  boardId?: number;
  columnId?: number;
  cardId?: number;
  accessToken?: string;
};

/**
 * API 로그인 및 액세스 토큰 획득
 */
async function loginAndGetToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: TEST_USER
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.accessToken;
}

/**
 * 테스트용 보드 생성
 */
async function createTestBoard(request: APIRequestContext, token: string, workspaceId: number) {
  const response = await request.post(`${API_BASE_URL}/workspaces/${workspaceId}/boards`, {
    headers: { 'Authorization': `Bearer ${token}` },
    data: {
      name: '[E2E TEST] Delayed Card Test Board',
      description: 'E2E 테스트용 보드 - 자동으로 삭제됩니다'
    }
  });

  expect(response.ok()).toBeTruthy();
  const board = await response.json();
  return board.id;
}

/**
 * 테스트용 칼럼 생성
 */
async function createTestColumn(request: APIRequestContext, token: string, workspaceId: number, boardId: number) {
  const response = await request.post(
    `${API_BASE_URL}/workspaces/${workspaceId}/boards/${boardId}/columns`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        name: 'Test Column',
        description: 'E2E 테스트용 칼럼'
      }
    }
  );

  expect(response.ok()).toBeTruthy();
  const column = await response.json();
  return column.id;
}

/**
 * 테스트용 지연 카드 생성 (과거 마감일로 설정)
 */
async function createDelayedCard(
  request: APIRequestContext,
  token: string,
  workspaceId: number,
  boardId: number,
  columnId: number
) {
  // 어제 날짜로 설정하여 지연 카드 생성
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dueDate = yesterday.toISOString().split('T')[0];

  const response = await request.post(
    `${API_BASE_URL}/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        title: '[E2E TEST] Delayed Card for Testing',
        description: 'E2E 테스트용 지연 카드 - 자동으로 삭제됩니다',
        priority: 'HIGH',
        dueDate: dueDate
      }
    }
  );

  expect(response.ok()).toBeTruthy();
  const card = await response.json();
  return card.id;
}

/**
 * 테스트 데이터 삭제 (카드, 보드)
 */
async function cleanupTestData(request: APIRequestContext, token: string) {
  if (!testData.workspaceId) return;

  // 카드 삭제 (선택적 - 보드 삭제 시 함께 삭제됨)
  if (testData.cardId && testData.boardId && testData.columnId) {
    try {
      await request.delete(
        `${API_BASE_URL}/workspaces/${testData.workspaceId}/boards/${testData.boardId}/columns/${testData.columnId}/cards/${testData.cardId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log(`Deleted test card: ${testData.cardId}`);
    } catch (error) {
      console.warn('Failed to delete test card:', error);
    }
  }

  // 보드 삭제 (칼럼과 카드도 함께 삭제됨)
  if (testData.boardId) {
    try {
      await request.delete(
        `${API_BASE_URL}/workspaces/${testData.workspaceId}/boards/${testData.boardId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log(`Deleted test board: ${testData.boardId}`);
    } catch (error) {
      console.warn('Failed to delete test board:', error);
    }
  }
}

test.describe('Dashboard - Delayed Card Management (Self-Contained)', () => {
  // 테스트 시작 전 워크스페이스 ID 초기화
  test.beforeAll(async () => {
    testData = { workspaceId: 1 };
  });

  test('should create delayed card, verify on dashboard, extend due date, and cleanup', async ({ page, request }) => {
    try {
      // ===== Step 1: API를 통해 테스트 데이터 생성 =====
      console.log('Step 1: Creating test data via API...');
      const token = await loginAndGetToken(request);
      testData.accessToken = token;

      testData.boardId = await createTestBoard(request, token, testData.workspaceId);
      console.log(`Created test board: ${testData.boardId}`);

      if (!testData.boardId) throw new Error('Failed to create test board');

      testData.columnId = await createTestColumn(request, token, testData.workspaceId, testData.boardId);
      console.log(`Created test column: ${testData.columnId}`);

      if (!testData.columnId) throw new Error('Failed to create test column');

      testData.cardId = await createDelayedCard(request, token, testData.workspaceId, testData.boardId, testData.columnId);
      console.log(`Created delayed test card: ${testData.cardId}`);

      // ===== Step 2: 브라우저로 로그인 =====
      console.log('Step 2: Logging in via browser...');
      await page.goto('/login');
      await expect(page).toHaveURL(/.*login/);
      await expect(page.getByRole('heading', { name: /한눈에 보이는/i })).toBeVisible();

      await page.locator('#email').fill(TEST_USER.email);
      await page.locator('#password').fill(TEST_USER.password);
      await page.getByRole('button', { name: '로그인' }).click();

      // 대시보드로 자동 이동 확인
      await expect(page).toHaveURL('/');

      // ===== Step 3: 대시보드에서 테스트 지연 카드 확인 =====
      console.log('Step 3: Verifying delayed card appears on dashboard...');
      const delayedSection = page.locator('h2:has-text("지연 중인 작업")').locator('xpath=ancestor::div[1]/following-sibling::*[1]');

      // 초기 지연 카드 개수 확인
      const initialDelayedCount = page.locator('h2:has-text("지연 중인 작업")').locator('xpath=..').locator('p');
      const initialCountText = await initialDelayedCount.textContent();
      expect(initialCountText).toContain('개의 카드');

      const match = initialCountText?.match(/(\d+)개의 카드/);
      const initialCount = parseInt(match![1]);
      expect(initialCount).toBeGreaterThanOrEqual(1);
      console.log(`Initial delayed card count: ${initialCount}`);

      // 테스트 카드가 지연 목록에 표시되는지 확인
      const testCard = delayedSection.getByRole('button').filter({ hasText: '[E2E TEST] Delayed Card for Testing' });
      await expect(testCard).toBeVisible();
      console.log('Test delayed card found on dashboard');

      // ===== Step 4: 지연 카드 클릭하여 모달 오픈 =====
      console.log('Step 4: Opening card edit modal...');
      await testCard.click();

      // 카드 수정 모달이 오픈되었는지 확인
      await expect(page.getByRole('heading', { name: '카드 수정' })).toBeVisible();
      await expect(page.getByText('카드 정보를 수정하세요')).toBeVisible();

      // 현재 마감일 확인 및 저장
      const dueDateInput = page.locator('input[type="date"]');
      const currentDueDate = await dueDateInput.inputValue();
      console.log(`Current due date: ${currentDueDate}`);

      // ===== Step 5: 마감일을 1주일 연장 =====
      console.log('Step 5: Extending due date by 7 days...');
      const currentDate = new Date(currentDueDate);
      currentDate.setDate(currentDate.getDate() + 7);
      const newDueDate = currentDate.toISOString().split('T')[0];

      await dueDateInput.click();
      await dueDateInput.fill(newDueDate);

      // 마감일이 올바르게 변경되었는지 확인
      await expect(dueDateInput).toHaveValue(newDueDate);
      console.log(`New due date: ${newDueDate}`);

      // 수정 버튼 클릭
      const updateButton = page.getByRole('button', { name: '수정' });
      await expect(updateButton).toBeEnabled();
      await updateButton.click();

      // 모달이 닫히고 보드 페이지로 이동했는지 확인
      await page.waitForURL(/.*boards\/\d+\/\d+/, { timeout: 10000 });

      // ===== Step 6: 대시보드로 돌아가서 카드가 지연 목록에서 제거되었는지 확인 =====
      console.log('Step 6: Returning to dashboard and verifying card removal...');
      await page.getByRole('button', { name: 'Kanban Master' }).click();

      // 드롭다운 메뉴가 표시되면 대시보드 클릭
      const dashboardButton = page.getByRole('button', { name: /📊 대시보드/ });
      if (await dashboardButton.isVisible()) {
        await dashboardButton.click();
      }

      // 대시보드 페이지 확인
      await expect(page).toHaveURL('/');

      // [핵심 검증] 지연 카드 개수가 1개 감소했는지 확인
      const delayedSectionHeader = page.locator('h2:has-text("지연 중인 작업")');
      const delayedSectionExists = await delayedSectionHeader.count() > 0;

      if (delayedSectionExists) {
        // 지연 섹션이 여전히 존재하는 경우 (다른 지연 카드가 있음)
        const delayedCountAfter = delayedSectionHeader.locator('xpath=..').locator('p');
        const finalCountText = await delayedCountAfter.textContent();
        const finalMatch = finalCountText?.match(/(\d+)개의 카드/);
        const finalCount = parseInt(finalMatch![1]);

        console.log(`Final delayed card count: ${finalCount}`);
        expect(finalCount).toBe(initialCount - 1);

        // 테스트 카드가 지연 목록에서 사라졌는지 확인
        const delayedSectionAfter = delayedSectionHeader.locator('xpath=ancestor::div[1]/following-sibling::*[1]');
        const removedCard = delayedSectionAfter.getByRole('button').filter({ hasText: '[E2E TEST] Delayed Card for Testing' });
        await expect(removedCard).not.toBeVisible();
        console.log('Test card successfully removed from delayed list');
      } else {
        // 지연 섹션이 사라진 경우 (지연 카드가 0개가 됨)
        console.log('Delayed section no longer exists - all delayed cards were removed');
        expect(initialCount).toBe(1); // 우리가 생성한 테스트 카드가 유일한 지연 카드였음을 확인
        console.log('✅ Verified: Our test card was the only delayed card and has been removed');
      }

      console.log('✅ Test completed successfully');
    } finally {
      // ===== Step 7: 테스트 데이터 정리 =====
      console.log('Step 7: Cleaning up test data...');
      if (testData.accessToken) {
        await cleanupTestData(request, testData.accessToken);
      }
    }
  });
});
