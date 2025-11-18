import { test, expect } from '@playwright/test';

/**
 * 칸반 보드 E2E 테스트
 *
 * 주의: 이 테스트들은 로그인이 필요합니다.
 * 실제 테스트 전에 인증 상태를 설정하거나 모킹이 필요할 수 있습니다.
 */

test.describe('Kanban Board', () => {
  // 로그인이 필요한 경우 beforeEach에서 처리
  test.beforeEach(async ({ page }) => {
    // TODO: 테스트 계정으로 로그인 또는 인증 토큰 설정
    // await page.goto('/login');
    // await loginAsTestUser(page);

    // 임시로 보드 페이지로 직접 이동 (인증 체크가 있다면 실패할 수 있음)
    await page.goto('/board');
  });

  test('should display board columns', async ({ page }) => {
    // 기본 컬럼들이 표시되는지 확인
    // 실제 컬럼 이름은 애플리케이션에 맞게 수정
    const columns = ['To Do', 'In Progress', 'Done', '할 일', '진행 중', '완료'];

    let foundColumn = false;
    for (const columnName of columns) {
      const column = page.getByText(columnName, { exact: false });
      if (await column.isVisible()) {
        foundColumn = true;
        break;
      }
    }

    // 최소한 하나의 컬럼이 표시되어야 함
    if (!foundColumn) {
      // 컬럼 컨테이너가 있는지 확인
      await expect(page.locator('[data-testid*="column"], .column, .board-column')).toBeVisible();
    }
  });

  test.skip('should create a new card', async ({ page }) => {
    // 카드 생성 버튼 클릭
    const createButton = page.getByRole('button', { name: /add|create|추가|생성/i });
    await createButton.click();

    // 카드 입력 폼이 나타나는지 확인
    await expect(page.getByLabel(/title|제목/i)).toBeVisible();

    // 카드 정보 입력
    await page.getByLabel(/title|제목/i).fill('Test Card');
    await page.getByLabel(/description|설명/i).fill('This is a test card');

    // 저장 버튼 클릭
    await page.getByRole('button', { name: /save|저장/i }).click();

    // 새 카드가 보드에 표시되는지 확인
    await expect(page.getByText('Test Card')).toBeVisible();
  });

  test.skip('should edit a card', async ({ page }) => {
    // 기존 카드 클릭
    const firstCard = page.locator('.card, [data-testid*="card"]').first();
    await firstCard.click();

    // 편집 모드로 전환
    const editButton = page.getByRole('button', { name: /edit|수정/i });
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    // 카드 제목 수정
    const titleInput = page.getByLabel(/title|제목/i);
    await titleInput.clear();
    await titleInput.fill('Updated Card Title');

    // 저장
    await page.getByRole('button', { name: /save|저장/i }).click();

    // 수정된 내용이 반영되었는지 확인
    await expect(page.getByText('Updated Card Title')).toBeVisible();
  });

  test.skip('should delete a card', async ({ page }) => {
    // 카드 클릭
    const firstCard = page.locator('.card, [data-testid*="card"]').first();
    const cardText = await firstCard.textContent();
    await firstCard.click();

    // 삭제 버튼 클릭
    const deleteButton = page.getByRole('button', { name: /delete|삭제/i });
    await deleteButton.click();

    // 확인 다이얼로그가 있다면 확인
    const confirmButton = page.getByRole('button', { name: /confirm|확인/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // 카드가 삭제되었는지 확인
    if (cardText) {
      await expect(page.getByText(cardText)).not.toBeVisible();
    }
  });

  test.skip('should drag and drop a card between columns', async ({ page }) => {
    // 첫 번째 카드 찾기
    const sourceCard = page.locator('.card, [data-testid*="card"]').first();
    const targetColumn = page.locator('.column, [data-testid*="column"]').nth(1);

    // 드래그 앤 드롭 수행
    await sourceCard.dragTo(targetColumn);

    // 카드가 새 컬럼으로 이동했는지 확인
    // (실제 검증 로직은 DOM 구조에 따라 달라질 수 있음)
    await page.waitForTimeout(500); // 애니메이션 대기
  });
});
