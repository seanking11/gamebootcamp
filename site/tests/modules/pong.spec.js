import { test, expect } from '@playwright/test';

test.describe('Pong — Demo: Mini Playable Pong', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('modules/01-pong/', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__test?.['demo-pong']);
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('initial state is playing with score 0-0', async () => {
    const s = await page.evaluate(() => window.__test['demo-pong'].getState());
    expect(s.state).toBe('playing');
    expect(s.scoreL).toBe(0);
    expect(s.scoreR).toBe(0);
  });

  test('ball moves when ticked', async () => {
    await page.evaluate(() => window.__test['demo-pong'].restart());
    const before = await page.evaluate(() => window.__test['demo-pong'].getState());

    // Run several ticks
    await page.evaluate(() => {
      for (let i = 0; i < 10; i++) window.__test['demo-pong'].tick();
    });

    const after = await page.evaluate(() => window.__test['demo-pong'].getState());
    const moved = before.ball.x !== after.ball.x || before.ball.y !== after.ball.y;
    expect(moved).toBe(true);
  });

  test('scoring works when ball goes past left edge', async () => {
    await page.evaluate(() => {
      const h = window.__test['demo-pong'];
      h.restart();
      // Place ball near left edge moving left
      h.setBallPos(5, 230);
      h.setBallVel(-10, 0);
      // Tick until ball goes past edge
      for (let i = 0; i < 10; i++) h.tick();
    });

    const s = await page.evaluate(() => window.__test['demo-pong'].getState());
    expect(s.scoreR).toBe(1);
  });

  test('scoring works when ball goes past right edge', async () => {
    await page.evaluate(() => {
      const h = window.__test['demo-pong'];
      h.restart();
      // Place ball near right edge moving right
      h.setBallPos(755, 230);
      h.setBallVel(10, 0);
      // Tick until ball goes past edge
      for (let i = 0; i < 10; i++) h.tick();
    });

    const s = await page.evaluate(() => window.__test['demo-pong'].getState());
    expect(s.scoreL).toBe(1);
  });

  test('game over at score limit', async () => {
    await page.evaluate(() => {
      const h = window.__test['demo-pong'];
      h.restart();
      // Score 5 times for left player by repeatedly placing ball past right edge
      for (let round = 0; round < 5; round++) {
        h.setBallPos(780, 230);
        h.setBallVel(10, 0);
        for (let i = 0; i < 5; i++) h.tick();
      }
    });

    const s = await page.evaluate(() => window.__test['demo-pong'].getState());
    expect(s.state).toBe('gameover');
    expect(s.scoreL).toBe(5);
    expect(s.msg).toContain('Win');
  });

  test('restart resets everything', async () => {
    // First get to game over
    await page.evaluate(() => {
      const h = window.__test['demo-pong'];
      h.restart();
      for (let round = 0; round < 5; round++) {
        h.setBallPos(780, 230);
        h.setBallVel(10, 0);
        for (let i = 0; i < 5; i++) h.tick();
      }
    });

    // Now restart
    await page.evaluate(() => window.__test['demo-pong'].restart());
    const s = await page.evaluate(() => window.__test['demo-pong'].getState());
    expect(s.state).toBe('playing');
    expect(s.scoreL).toBe(0);
    expect(s.scoreR).toBe(0);
  });

  test('ball bounces off top/bottom walls', async () => {
    await page.evaluate(() => {
      const h = window.__test['demo-pong'];
      h.restart();
      // Place ball near top wall moving up
      h.setBallPos(380, 10);
      h.setBallVel(0, -10);
      h.tick();
    });

    const s = await page.evaluate(() => window.__test['demo-pong'].getState());
    // Ball should bounce - vy should now be positive
    expect(s.ball.vy).toBeGreaterThan(0);
  });

  test('mouse Y controls player paddle', async () => {
    await page.evaluate(() => {
      const h = window.__test['demo-pong'];
      h.restart();
      h.setMouseY(100);
      for (let i = 0; i < 30; i++) h.tick();
    });

    const s = await page.evaluate(() => window.__test['demo-pong'].getState());
    // Paddle should have moved toward y=100
    expect(s.p1.y).toBeLessThan(200);
  });
});
