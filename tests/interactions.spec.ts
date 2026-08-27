import { expect, test } from '@playwright/test';

async function gotoShort(page: import('@playwright/test').Page) {
  await page.goto('/index_gift2_113.html');
  await page.locator('html[data-app-ready="true"]').waitFor();
}

test('short-page quiz and video close by button, backdrop and Escape', async ({ page }) => {
  await gotoShort(page);

  await page.locator('.apartment-card .section-cta').first().click();
  await expect(page.getByLabel('Подбор квартир')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Подбор квартир')).toBeHidden();

  await page.locator('.apartment-card .section-cta').first().click();
  await page.locator('.quiz-overlay').click({ position: { x: 4, y: 4 } });
  await expect(page.getByLabel('Подбор квартир')).toBeHidden();

  const videoButton = page.getByRole('button', { name: 'Смотреть видео о жилом комплексе' });
  const videoDialog = page.getByRole('dialog', { name: 'Видео о жилом комплексе' });
  await videoButton.click();
  await expect(videoDialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(videoDialog).toBeHidden();

  await videoButton.click();
  await page.locator('.video-modal').click({ position: { x: 4, y: 4 } });
  await expect(videoDialog).toBeHidden();
});

test('primary controls expose hover and keyboard-focus states', async ({ page }) => {
  await gotoShort(page);
  const purpose = page.getByLabel('Выберите цель покупки').getByRole('button', { name: 'Жить' });
  const idleBackground = await purpose.evaluate((element) => getComputedStyle(element).backgroundColor);
  await purpose.hover();
  const hoverBackground = await purpose.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(hoverBackground).not.toBe(idleBackground);

  await purpose.focus();
  await expect(purpose).toBeFocused();
  const outline = await purpose.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe('none');
});

test('long-page lightbox and video close from backdrop and Escape', async ({ page }) => {
  await page.goto('/kvartiry-sochi.html');

  await page.locator('.gal-item').first().click();
  const lightbox = page.locator('.lb-overlay').first();
  await expect(lightbox).toHaveClass(/open|show|active/);
  await page.keyboard.press('Escape');
  await expect(lightbox).not.toHaveClass(/open|show|active/);

  await page.locator('.gal-item').first().click();
  await lightbox.click({ position: { x: 4, y: 4 } });
  await expect(lightbox).not.toHaveClass(/open|show|active/);

  await page.locator('#videoLink').click();
  await expect(page.locator('#videoModal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#videoModal')).toBeHidden();

  await page.locator('#videoLink').click();
  await page.locator('#videoModal').click({ position: { x: 4, y: 4 } });
  await expect(page.locator('#videoModal')).toBeHidden();
});
