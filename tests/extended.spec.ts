import { expect, test } from '@playwright/test';

async function openLanding(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('html[data-app-ready="true"]').waitFor();
}

test('catalog, complex facts and advantages show the current Sochi Park offer', async ({ page }) => {
  await openLanding(page);

  await expect(page.getByRole('heading', { name: /Квартиры в ЖК/ })).toBeVisible();
  await expect(page.getByText('Бизнес-класс', { exact: true })).toBeVisible();
  await expect(page.getByText('Сдан, 2022 г.', { exact: true })).toBeVisible();
  await expect(page.getByText('около 1 500 м', { exact: true })).toBeVisible();
  await expect(page.locator('.apartment-card')).toHaveCount(3);
  await expect(page.locator('.advantage-card')).toHaveCount(6);

  const imagesWithoutAlt = await page.locator('.apartment-card img, .advantage-card img').evaluateAll((images) =>
    images.filter((image) => !image.getAttribute('alt')?.trim()).length,
  );
  expect(imagesWithoutAlt).toBe(0);
});

test('catalog and advantage calls to action still open the one quiz flow', async ({ page }) => {
  await openLanding(page);
  const quiz = page.getByLabel('Подбор квартир');

  await page.locator('.apartment-card .section-cta').first().click();
  await expect(quiz).toBeVisible();
  await quiz.getByRole('button', { name: 'Закрыть' }).click();

  await page.locator('.advantages-cta').click();
  await expect(quiz).toBeVisible();
});
