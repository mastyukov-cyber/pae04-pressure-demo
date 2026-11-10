'use strict';
const { test, expect } = require('@playwright/test');

// Browser engine: Linux Playwright WebKit with iPhone dimensions, NOT real iOS Safari.
// Public synthetic test page, no account creation or credential entry.
const profiles = [
  ['narrow-320-portrait', 320, 700],
  ['compact-375-portrait', 375, 812],
  ['iPhone-390-portrait', 390, 844],
  ['large-430-portrait', 430, 932],
  ['iPhone-844-landscape', 844, 390],
];

for (const [name, width, height] of profiles) {
  test('PAE-04 synthetic responsive layout ' + name, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      locale: 'ru-RU',
      storageState: { cookies: [], origins: [] },
    });
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await expect(page.getByRole('heading', { name: 'Новое измерение' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Создать тестовый аккаунт' })).toBeVisible();

      const metrics = await page.evaluate(() => {
        const visibleWidth = window.innerWidth;
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const suspects = [];
        for (const element of document.querySelectorAll('body *')) {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          if (rect.width <= 0 || style.display === 'none' || style.position === 'fixed') continue;
          if (rect.right > visibleWidth + 1 || rect.left < -1) {
            suspects.push({
              tag: element.tagName.toLowerCase(),
              id: element.id || '',
              right: Math.round(rect.right),
              left: Math.round(rect.left),
            });
          }
        }
        return {
          viewport: visibleWidth,
          documentScrollWidth: docWidth,
          bodyScrollWidth: bodyWidth,
          overflowingElements: suspects.slice(0, 12),
        };
      });
      console.log('PAE04_QA_VIEWPORT', JSON.stringify({ name, ...metrics }));
      expect(metrics.documentScrollWidth, 'Document must fit the iPhone width').toBeLessThanOrEqual(width + 1);
      expect(metrics.bodyScrollWidth, 'Body must fit the iPhone width').toBeLessThanOrEqual(width + 1);
      expect(metrics.overflowingElements, 'Off-screen elements: ' + JSON.stringify(metrics.overflowingElements)).toEqual([]);

      // Validation only: no Supabase request, no password and no account creation.
      await page.getByRole('button', { name: 'Войти' }).click();
      await expect(page.locator('#status')).toContainText('Укажите тестовую почту');
      await expect(page.locator('#formPanel')).toBeHidden();
    } finally {
      await context.close();
    }
  });
}
