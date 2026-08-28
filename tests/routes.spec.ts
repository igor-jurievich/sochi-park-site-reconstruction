import { expect, test } from '@playwright/test';

const routes = [
  ['/', /Смотрите подборки/],
  ['/index_ctrl113.html', /Смотрите подборки/],
  ['/index_gift2_113.html', /Смотрите подборки/],
  ['/kvartiry-sochi.html', /Своя квартира в ЖК Сочи Парк/],
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

test('long-page local assets do not depend on the source host', async ({ page }) => {
  const sourceRequests: string[] = [];
  page.on('request', (request) => {
    if (/sochipark-info\.ru/i.test(request.url())) sourceRequests.push(request.url());
  });
  await page.goto('/kvartiry-sochi.html');
  await page.waitForLoadState('networkidle');
  expect(sourceRequests).toEqual([]);
});
