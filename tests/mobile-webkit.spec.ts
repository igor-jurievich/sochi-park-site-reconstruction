import { expect, test } from '@playwright/test';

test('iPhone 16 Pro Max keeps apartment plans and CTAs in one stable column', async ({ page }) => {
  await page.goto('/');
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' });

  const geometry = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.apartment-card'));
    const hero = document.querySelector<HTMLElement>('.hero');
    return {
      gridDisplay: getComputedStyle(document.querySelector<HTMLElement>('.apartment-grid')!).display,
      cardWidths: cards.map((card) => Math.round(card.getBoundingClientRect().width)),
      buttonWidths: cards.map((card) => Math.round(card.querySelector('button')!.getBoundingClientRect().width)),
      cardTops: cards.map((card) => Math.round(card.getBoundingClientRect().top)),
      heroHeight: Math.round(hero!.getBoundingClientRect().height),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  expect(geometry.gridDisplay).toBe('block');
  expect(geometry.cardWidths.every((width) => width >= 370)).toBe(true);
  expect(geometry.buttonWidths.every((width) => width >= 320)).toBe(true);
  expect(geometry.cardTops[1]).toBeGreaterThan(geometry.cardTops[0]);
  expect(geometry.cardTops[2]).toBeGreaterThan(geometry.cardTops[1]);
  expect(geometry.heroHeight).toBeGreaterThanOrEqual(978);
  expect(geometry.overflow).toBe(0);

  await page.setViewportSize({ width: 440, height: 820 });
  await expect.poll(() => page.locator('.hero').evaluate((element) => Math.round(element.getBoundingClientRect().height))).toBe(978);
});

test('mobile hero phrase is typed character by character', async ({ page }) => {
  await page.goto('/');
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' });
  const typed = page.locator('.hero-typed');

  await page.waitForTimeout(420);
  const firstSample = await typed.textContent();
  await page.waitForTimeout(420);
  const secondSample = await typed.textContent();

  expect(firstSample?.length).toBeGreaterThan(0);
  expect(secondSample?.startsWith(firstSample || '')).toBe(true);
  expect(secondSample!.length).toBeGreaterThan(firstSample!.length);
  await expect(page.locator('.hero-rotator')).toHaveAttribute('aria-label', /Бизнес-класс в микрорайоне Бытха|До моря около 1 500 м|Школа и детский сад рядом|Планировки для жизни и аренды/);
});
