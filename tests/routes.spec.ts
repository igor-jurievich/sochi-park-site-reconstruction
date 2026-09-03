import { expect, test } from '@playwright/test';

const routes = [
  ['/', /Квартиры в ЖК/],
  ['/index_ctrl113.html', /Квартиры в ЖК/],
  ['/index_gift2_113.html', /Квартиры в ЖК/],
  ['/kvartiry-sochi.html', /Квартиры в ЖК/],
  ['/privacy.html', /Политика обработки персональных данных/],
  ['/policy.html', /Политика конфиденциальности и Cookie/],
  ['/spasibo.html?region=eu', /Уже готовим вашу подборку/],
  ['/spasibo2.html?region=eu', /Уже готовим вашу подборку/],
  ['/spasibo?region=eu', /Уже готовим вашу подборку/],
  ['/spasibo2?region=eu', /Уже готовим вашу подборку/],
] as const;

for (const [route, heading] of routes) {
  test(`${route} loads its expected page without horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1').first()).toContainText(heading);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
}

test('legacy entry routes permanently converge on the one canonical landing page', async ({ page }) => {
  for (const path of ['/index_ctrl113.html', '/index_gift2_113.html', '/kvartiry-sochi.html']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
  }
});
