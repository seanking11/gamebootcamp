import { test, expect } from '@playwright/test';
import { modules } from './helpers/module-manifest.js';

// Generate smoke tests for every module page
for (const mod of modules) {
  test.describe(`Module: ${mod.slug}`, () => {
    let page;
    const consoleErrors = [];

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();

      // Capture console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Navigate to the module page
      const response = await page.goto(`modules/${mod.slug}/`, {
        waitUntil: 'networkidle',
        timeout: 30_000,
      });

      // Store response for status check
      page._smokeResponse = response;
    });

    test.afterAll(async () => {
      await page?.close();
    });

    test('returns HTTP 200', async () => {
      expect(page._smokeResponse?.status()).toBe(200);
    });

    test('no JS console errors', async () => {
      // Wait a moment for any deferred scripts
      await page.waitForTimeout(500);
      const real = consoleErrors.filter(
        (e) => !e.includes('favicon') && !e.includes('third-party')
      );
      expect(real).toEqual([]);
    });

    test('all expected canvases exist with non-zero dimensions', async () => {
      for (const id of mod.canvasIds) {
        const canvas = page.locator(`canvas#${id}`);
        await expect(canvas).toBeVisible({ timeout: 5_000 });

        const box = await canvas.boundingBox();
        expect(box, `canvas#${id} should have a bounding box`).not.toBeNull();
        expect(box.width, `canvas#${id} width`).toBeGreaterThan(0);
        expect(box.height, `canvas#${id} height`).toBeGreaterThan(0);
      }
    });

    test('navigation links resolve to valid pages', async () => {
      const navLinks = await page.locator('.module-nav a').all();
      for (const link of navLinks) {
        const href = await link.getAttribute('href');
        if (!href) continue;
        const res = await page.request.head(href);
        expect(res.status(), `nav link ${href} should be valid`).toBeLessThan(400);
      }
    });

    test('no broken resource loads', async () => {
      const failures = [];

      // Check for failed requests that happened during load
      page.on('requestfailed', (req) => {
        failures.push(`${req.failure().errorText}: ${req.url()}`);
      });

      // Reload to capture any missed failures
      await page.reload({ waitUntil: 'networkidle', timeout: 30_000 });

      // Filter out known acceptable failures (e.g., optional analytics)
      const real = failures.filter(
        (f) => !f.includes('favicon') && !f.includes('analytics')
      );
      expect(real).toEqual([]);
    });
  });
}
