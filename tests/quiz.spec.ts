import { expect, test, type Page } from '@playwright/test';

async function markGiftWon(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('sochi-gift-won', '1'));
}

async function gotoReady(page: Page) {
  await page.goto('/');
  await page.locator('html[data-app-ready="true"]').waitFor();
}

async function reachPromo(page: Page) {
  await page.getByRole('button', { name: 'Жить', exact: true }).click();
  await expect(page.getByText('Выберите количество комнат в Вашей подборке')).toBeVisible();
  await page.getByRole('button', { name: 'Студия', exact: true }).click();
  await page.getByRole('button', { name: 'Ремонт', exact: true }).click();
  await expect(page.getByText('Какую акцию включить в Вашу подборку?')).toBeVisible();
}

test('main path reaches local success with validation', async ({ page }) => {
  await page.clock.install();
  await markGiftWon(page);
  await gotoReady(page);
  await reachPromo(page);
  await page.getByRole('button', { name: 'Без первого взноса', exact: true }).click();
  await page.clock.fastForward(500);
  await expect(page.getByRole('heading', { name: 'Анализируем запрос' })).toBeVisible();
  await page.clock.fastForward(9_000);
  await expect(page.getByText(/в какой мессенджер прислать/)).toBeVisible();
  await page.getByRole('button', { name: 'Telegram', exact: true }).click();
  await page.clock.fastForward(500);
  await expect(page.getByText(/на какой номер Telegram отправить/)).toBeVisible();
  await page.getByLabel('Телефон').fill('9123456789');
  await page.locator('.consent input').uncheck();
  await page.getByRole('button', { name: 'Смотреть мою подборку', exact: true }).click();
  await expect(page.getByText('Необходимо согласиться с политикой конфиденциальности')).toBeVisible();
  await page.locator('.consent input').check();
  await page.getByPlaceholder('Как вас зовут?').fill('Тест');
  await page.getByRole('button', { name: 'Смотреть мою подборку', exact: true }).click();
  await page.clock.fastForward(700);
  await expect(page.getByRole('heading', { name: 'Спасибо!' })).toBeVisible();
});

test('alternate first answer and Back restore the previous question', async ({ page }) => {
  await gotoReady(page);
  await page.getByRole('button', { name: 'Отдыхать', exact: true }).click();
  await expect(page.getByText('Выберите количество комнат в Вашей подборке')).toBeVisible();
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page.getByText('Смотрите подходящую подборку квартир у моря')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Для отдыха', exact: true })).not.toHaveClass(/selected/);
});

test('close and reopen preserve the current quiz step', async ({ page }) => {
  await gotoReady(page);
  await page.getByRole('button', { name: 'Перепродать', exact: true }).click();
  await expect(page.getByText('Выберите количество комнат в Вашей подборке')).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть' }).click();
  await page.locator('.apartment-card .section-cta').first().click();
  await expect(page.getByText('Выберите количество комнат в Вашей подборке')).toBeVisible();
});

test('mobile modal has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page);
  await page.getByRole('button', { name: 'Сдавать', exact: true }).click();
  await expect(page.getByText('Выберите количество комнат в Вашей подборке')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
