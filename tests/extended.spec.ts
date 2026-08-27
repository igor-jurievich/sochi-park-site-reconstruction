import { expect, test } from '@playwright/test';

async function openLongPage(page: import('@playwright/test').Page) {
  await page.goto('/kvartiry-sochi.html');
  await expect(page.locator('h1')).toContainText('Своя квартира в ЖК Сочи Парк');
}

test('gallery filters, lightbox, video and all document accordions work', async ({ page }) => {
  await openLongPage(page);

  const filters = page.locator('.gal-filter');
  await expect(filters).toHaveCount(7);
  for (let i = 0; i < await filters.count(); i += 1) {
    await filters.nth(i).click();
    await expect(filters.nth(i)).toHaveClass(/active/);
    const visibleItems = await page.locator('.gal-item').evaluateAll((items) =>
      items.filter((item) => getComputedStyle(item).display !== 'none').length,
    );
    expect(visibleItems).toBeGreaterThan(0);
  }

  await filters.first().click();
  await page.locator('.gal-item').first().click();
  const lightbox = page.locator('.lb-overlay').first();
  await expect(lightbox).toHaveClass(/open|show|active/);
  await lightbox.locator('button').filter({ hasText: '›' }).click();
  await lightbox.locator('button').filter({ hasText: '‹' }).click();
  await lightbox.locator('button').filter({ hasText: '×' }).click();
  await expect(lightbox).not.toHaveClass(/open|show|active/);

  await page.locator('#videoLink').click();
  await expect(page.locator('#videoModal')).toBeVisible();
  await page.locator('#closeModalBtn').click();
  await expect(page.locator('#videoModal')).toBeHidden();

  const accordions = page.locator('.ac-title');
  await expect(accordions).toHaveCount(3);
  for (let i = 0; i < 3; i += 1) {
    await accordions.nth(i).click();
    await expect(accordions.nth(i).locator('..')).toHaveClass(/open/);
    await accordions.nth(i).click();
    await expect(accordions.nth(i).locator('..')).not.toHaveClass(/open/);
  }
});

test('desktop navigation and mobile burger reach their sections', async ({ page }) => {
  await openLongPage(page);
  await page.locator('#mainMenu a[href="#documents"]').click();
  await expect(page).toHaveURL(/#documents$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.locator('label[for="burger-checkbox"]').click();
  await expect(page.locator('#burger-checkbox')).toBeChecked();
  await page.locator('.menu-item[href="#contact"]').click();
  await expect(page).toHaveURL(/#contact$/);
});

test('every long-page quiz answer advances and Back returns to the same step', async ({ page }) => {
  test.setTimeout(60_000);
  await openLongPage(page);
  await page.locator('.open-modal-button').first().click();
  await expect(page.locator('#quiz-modal')).toHaveClass(/show/);

  const selectableSlideCount = 6;
  for (let slideIndex = 0; slideIndex < selectableSlideCount; slideIndex += 1) {
    const active = page.locator('.qz-slide.active');
    const expectedIndex = await page.locator('.qz-slide').evaluateAll((slides) =>
      slides.findIndex((slide) => slide.classList.contains('active')),
    );
    expect(expectedIndex).toBe(slideIndex);
    const optionCount = await active.locator('label.qz-opt').count();
    expect(optionCount).toBeGreaterThan(0);

    for (let optionIndex = 0; optionIndex < optionCount; optionIndex += 1) {
      await active.locator('label.qz-opt').nth(optionIndex).click();
      await expect.poll(async () => page.locator('.qz-slide').evaluateAll((slides) =>
        slides.findIndex((slide) => slide.classList.contains('active')),
      )).toBe(slideIndex + 1);
      await page.locator('.qz-back').click();
      await expect.poll(async () => page.locator('.qz-slide').evaluateAll((slides) =>
        slides.findIndex((slide) => slide.classList.contains('active')),
      )).toBe(slideIndex);
    }

    await active.locator('label.qz-opt').first().click();
    await expect.poll(async () => page.locator('.qz-slide').evaluateAll((slides) =>
      slides.findIndex((slide) => slide.classList.contains('active')),
    )).toBe(slideIndex + 1);
  }

  await expect(page.locator('#userPhone')).toBeVisible();
  await page.locator('.qz-close').click();
  await expect(page.locator('#quiz-modal')).not.toHaveClass(/show/);
});

test('long-page quiz validates consent and redirects locally', async ({ page }) => {
  await page.clock.install();
  await openLongPage(page);
  await page.clock.fastForward(1_000);
  await page.locator('.open-modal-button').first().click();
  for (let i = 0; i < 6; i += 1) {
    await page.locator('.qz-slide.active label.qz-opt').first().click();
    await page.clock.fastForward(500);
  }
  await page.locator('#userName').fill('Тест');
  await page.locator('#userPhone').fill('9123456789');
  await page.locator('#privacyConsent').uncheck();
  await page.locator('.qz-submit').click();
  await page.clock.fastForward(20);
  await expect(page.locator('.qz-tooltip')).toContainText('Необходимо согласиться с политикой конфиденциальности');
  await page.locator('#privacyConsent').check();
  await page.locator('.qz-submit').click();
  await page.clock.fastForward(3_600);
  await expect(page).toHaveURL(/\/spasibo\.html\?region=eu$/);
});
