import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/leads', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, leadId: 'test-lead', bitrixLeadId: 'test-bitrix' }) });
  });
});

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
  await page.clock.fastForward(8_500);
  await expect(page.getByRole('heading', { name: 'Подборка готова!' })).toBeVisible();
  await expect(page.getByText(/в какой мессенджер прислать/)).not.toBeVisible();
  await page.clock.fastForward(700);
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
  await page.clock.fastForward(3600);
  await expect(page).toHaveURL(/\/spasibo\.html\?region=eu$/);
  await expect(page.getByRole('heading', { name: /Уже готовим вашу подборку/ })).toBeVisible();
});

test('submission sends quiz, source block and advertising attribution', async ({ page }) => {
  let captured: Record<string, unknown> | undefined;
  await page.unroute('**/api/leads');
  await page.route('**/api/leads', async (route) => {
    captured = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, leadId: 'test-lead' }) });
  });
  await page.clock.install();
  await markGiftWon(page);
  await page.goto('/?utm_source=avito&utm_medium=cpc&utm_campaign=test-campaign&avito_click_id=test-click');
  await page.locator('html[data-app-ready="true"]').waitFor();
  await reachPromo(page);
  await page.getByRole('button', { name: 'Без первого взноса', exact: true }).click();
  await page.clock.fastForward(9_700);
  await page.getByRole('button', { name: 'Telegram', exact: true }).click();
  await page.clock.fastForward(500);
  await page.getByLabel('Телефон').fill('9123456789');
  await page.getByPlaceholder('Как вас зовут?').fill('Тест');
  await page.getByRole('button', { name: 'Смотреть мою подборку', exact: true }).click();

  await expect.poll(() => captured).toBeTruthy();
  expect(captured).toMatchObject({
    purpose: 'Жить на море', rooms: 'Студия', finish: 'Ремонт', promo: 'Без первого взноса',
    messenger: 'telegram', countryCode: '+7', phone: '9123456789', name: 'Тест',
    block: 'Первый экран / Для жизни', consent: true,
    attribution: { utmSource: 'avito', utmMedium: 'cpc', utmCampaign: 'test-campaign', avitoClickId: 'test-click' },
  });
  expect(captured).not.toHaveProperty('website');
});

test('all 11 landing-page entry buttons open the quiz', async ({ page }) => {
  await gotoReady(page);
  const quiz = page.getByLabel('Подбор квартир');

  for (const label of ['Жить', 'Отдыхать', 'Перепродать', 'Сдавать']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(quiz).toBeVisible();
    await quiz.getByRole('button', { name: 'Закрыть' }).click();
    await expect(quiz).toBeHidden();
  }

  const sectionButtons = page.locator('.section-cta');
  await expect(sectionButtons).toHaveCount(7);
  for (let index = 0; index < 7; index += 1) {
    await sectionButtons.nth(index).click();
    await expect(quiz).toBeVisible();
    await quiz.getByRole('button', { name: 'Закрыть' }).click();
    await expect(quiz).toBeHidden();
  }
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

test('gift reel moves through prize rows before landing on the Turkey trip', async ({ page }) => {
  await gotoReady(page);
  await page.getByRole('button', { name: 'Жить', exact: true }).click();
  await page.getByRole('button', { name: 'Студия', exact: true }).click();
  await page.getByRole('button', { name: 'Ремонт', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Крутить барабан' })).toBeVisible();

  const track = page.getByTestId('gift-reel-track');
  const translateY = () => track.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42);
  const before = await translateY();
  await page.getByRole('button', { name: 'Крутить барабан' }).click();
  await page.waitForTimeout(300);
  const firstMove = await translateY();
  await page.waitForTimeout(500);
  const secondMove = await translateY();

  expect(firstMove).toBeLessThan(before - 1);
  expect(secondMove).toBeLessThan(firstMove - 1);
  await expect(page.getByRole('button', { name: 'Определяем приз…' })).toBeDisabled();
  await expect(page.getByText('ТУРЦИЮ 🇹🇷', { exact: true })).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.travel-certificate-bg')).toHaveAttribute('src', '/images/turkey-gift-certificate-bg.webp');
});

test('every short-page quiz answer advances and Back restores its question', async ({ page }) => {
  await page.clock.install();
  await markGiftWon(page);
  await gotoReady(page);
  await page.locator('.apartment-card .section-cta').first().click();
  const quiz = page.getByLabel('Подбор квартир');

  const purposeOptions = ['Для жизни', 'Для отдыха', 'Перепродать', 'Сдавать'];
  for (const option of purposeOptions) {
    await quiz.getByRole('button', { name: option, exact: true }).click();
    await page.clock.fastForward(350);
    await expect(page.getByText('Выберите количество комнат в Вашей подборке')).toBeVisible();
    await quiz.getByRole('button', { name: 'Назад' }).click();
    await expect(page.getByText('Смотрите подходящую подборку квартир у моря')).toBeVisible();
  }
  await quiz.getByRole('button', { name: purposeOptions[0], exact: true }).click();
  await page.clock.fastForward(350);

  const roomOptions = ['Студия', '1-комнатная', '2-комнатная', 'Посмотрю все варианты'];
  for (const option of roomOptions) {
    await quiz.getByRole('button', { name: option, exact: true }).click();
    await page.clock.fastForward(350);
    await expect(page.getByText('Выберите тип отделки в Вашей подборке')).toBeVisible();
    await quiz.getByRole('button', { name: 'Назад' }).click();
    await expect(page.getByText('Выберите количество комнат в Вашей подборке')).toBeVisible();
  }
  await quiz.getByRole('button', { name: roomOptions[0], exact: true }).click();
  await page.clock.fastForward(350);

  const finishOptions = ['Ремонт', 'Чистовая', 'Черновая', 'Посмотрю все варианты'];
  for (const option of finishOptions) {
    await quiz.getByRole('button', { name: option, exact: true }).click();
    await page.clock.fastForward(350);
    await expect(page.getByText('Какую акцию включить в Вашу подборку?')).toBeVisible();
    await quiz.getByRole('button', { name: 'Назад' }).click();
    await expect(page.getByText('Выберите тип отделки в Вашей подборке')).toBeVisible();
  }
  await quiz.getByRole('button', { name: finishOptions[0], exact: true }).click();
  await page.clock.fastForward(350);

  const promoOptions = ['Платёж от 20 000 ₽ в месяц', 'Без первого взноса', 'Скидка до 20% за наличный расчёт', 'Посмотрю все варианты'];
  for (const option of promoOptions) {
    await quiz.getByRole('button', { name: option, exact: true }).click();
    await page.clock.fastForward(500);
    await expect(quiz.getByRole('heading', { name: 'Анализируем запрос' })).toBeVisible();
    await page.clock.fastForward(9_400);
    await expect(page.getByText(/в какой мессенджер прислать/)).toBeVisible();
    await quiz.getByRole('button', { name: 'Назад' }).click();
    await expect(page.getByText('Какую акцию включить в Вашу подборку?')).toBeVisible();
  }
  await quiz.getByRole('button', { name: promoOptions[0], exact: true }).click();
  await page.clock.fastForward(500);
  await page.clock.fastForward(9_400);

  for (const option of ['WhatsApp', 'Telegram', 'Max']) {
    await quiz.getByRole('button', { name: option, exact: true }).click();
    await page.clock.fastForward(500);
    await expect(page.getByText(new RegExp(`на какой номер ${option}`))).toBeVisible();
    await quiz.getByRole('button', { name: 'Назад' }).click();
    await expect(page.getByText(/в какой мессенджер прислать/)).toBeVisible();
  }
});
