import { test, expect } from '@playwright/test';
test('beginner lesson, practice, shared solver, dictionary edit and reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Complete beginner', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Learn M2 / Old Pochmann' })).toBeVisible();
  await page.getByLabel('Before covering your eyes').check();
  await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByRole('button', { name: 'Completed ✓' })).toBeVisible();
  await page.getByRole('button', { name: 'Practice', exact: true }).first().click();
  await page.getByRole('button', { name: 'Reveal flashcard answer' }).click();
  await page.getByRole('button', { name: 'Good', exact: true }).click();
  await page.goto('/solve?scramble=R+U+R%27+U%27&parity=2');
  await expect(page.getByText('Verified solved', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hide memo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reveal memo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hide algorithms', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reveal algorithms', exact: true })).toBeVisible();
  await page.goto('/pairs');
  await page.getByRole('button', { name: /^Edit AA:/ }).click();
  await page.getByRole('textbox', { name: 'Primary word', exact: true }).fill('Apple astronaut');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Edit AA: Apple astronaut', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test('timer split, repeat protection, confirmation recovery, history and analysis', async ({
  page,
}) => {
  await page.goto('/timer');
  await expect(page.getByRole('button', { name: 'Enter time' })).toBeEnabled({ timeout: 30000 });
  await page.getByLabel('Memo / execution split').check();
  await page.locator('h1').click();
  await page.keyboard.down('Space');
  await page.waitForTimeout(350);
  await page.keyboard.up('Space');
  await page.waitForTimeout(100);
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  await expect(page.getByRole('status').filter({ hasText: 'memo-complete' })).toContainText(
    'memo-complete',
  );
  await page.waitForTimeout(100);
  await page.keyboard.press('Space');
  await expect(page.getByText(/Confirm result/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Confirm result/)).toBeVisible();
  await page.getByRole('button', { name: '+2', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Analyze / Review memo' })).toBeVisible();
  await page.getByRole('button', { name: 'Analyze / Review memo' }).click();
  await expect(page.getByText('Verified solved', { exact: true })).toBeVisible();
});
test('invalid exercise links and shared parity do not crash', async ({ page }) => {
  await page.goto('/practice?v=99&mode=trace&fixture=missing');
  await expect(page.getByRole('alert')).toContainText('Invalid exercise link');
  await page.goto('/solve?scramble=R&parity=9');
  await expect(page.getByText(/Invalid shared URL/)).toBeVisible();
});
test('offline lessons, cached solver, dictionaries and timer generation', async ({
  page,
  context,
}) => {
  await page.goto('/solve?scramble=R&parity=1');
  await expect(page.getByText('Verified solved', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: 'Learn M2 / Old Pochmann' })).toBeVisible();
  await page.goto('/solve?scramble=R&parity=1');
  await expect(
    page.getByText('Offline: showing a previously verified cached solution.'),
  ).toBeVisible();
  await page.goto('/timer');
  await expect(page.getByRole('button', { name: 'Enter time' })).toBeEnabled({ timeout: 30000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
});
test('responsive pages retain controls without page-wide overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      '/',
      '/learn',
      '/practice',
      '/pairs',
      '/timer',
      '/statistics',
      '/settings',
      '/solve?scramble=R',
      '/letter-drill',
      '/algorithms',
    ]) {
      await page.goto(route);
      await expect(page.locator('header')).toBeVisible();
      await expect(page.getByText('Loading…', { exact: true })).toHaveCount(0);
      await expect(page.locator('main')).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.body.scrollWidth <= window.innerWidth), {
          message: `Overflow at ${width}px on ${route}`,
        })
        .toBe(true);
    }
  }
  for (const [route, name, width] of [
    ['/', 'home', 1440],
    ['/learn', 'lesson', 820],
    ['/solve?scramble=R', 'solver', 1440],
    ['/timer', 'timer', 390],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(route);
    await expect(page.getByText('Loading…', { exact: true })).toHaveCount(0);
    await expect(page.locator('main')).toBeVisible();
    if (route.startsWith('/solve'))
      await expect(page.getByText('Verified solved', { exact: true })).toBeVisible();
    if (route === '/timer')
      await expect(page.getByRole('button', { name: 'Enter time' })).toBeEnabled();
    await page.screenshot({ path: `/tmp/bld-${name}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('custom schemes translate memo and input without changing algorithms', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Scheme name').fill('Reverse edges');
  await page.getByLabel('Edge lettering permutation').fill('XWVUTSRQPONMLKJIHGFEDCBA');
  await page.getByRole('button', { name: 'Save new scheme', exact: true }).click();
  await page.goto('/solve?scramble=R&parity=1');
  await expect(page.getByText('Verified solved', { exact: true })).toBeVisible();
  const expected = await page.request.get('/api/cube?scramble=R&parity=1').then((r) => r.json());
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWX',
    rev = [...abc].reverse().join('');
  await page.getByLabel('Edges', { exact: true }).fill(
    expected.steps
      .filter((s: { phase: string }) => s.phase === 'edges')
      .map((s: { execution_target: string }) => rev[abc.indexOf(s.execution_target)])
      .join(''),
  );
  await page.getByLabel('Corners', { exact: true }).fill(expected.corner_memo);
  if (expected.steps.some((s: { phase: string }) => s.phase === 'parity'))
    await page.getByRole('checkbox', { name: /Parity/ }).check();
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByText('Correct: the cube is solved')).toBeVisible();
});
test('tracing preserves original memo and algorithm recall accepts equivalent moves', async ({
  page,
}) => {
  await page.goto('/practice?v=1&mode=trace&fixture=special');
  await page.getByLabel('Practice answer').fill('H');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct.' })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByLabel('Practice answer').fill('S');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Answer: I' })).toBeVisible();
  await page.goto('/practice?v=1&mode=algorithm&fixture=m2');
  await page.getByRole('button', { name: 'Reveal flashcard answer' }).click();
  await page.getByRole('button', { name: 'Again', exact: true }).click();
  await page.getByLabel('Practice answer').fill('invalid');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid move');
  await page.getByRole('button', { name: 'Reveal flashcard answer' }).click();
});
test('typing does not trigger timer, and touch supports hold/release', async ({
  page,
  browser,
}) => {
  await page.goto('/timer');
  await expect(page.getByRole('button', { name: 'Enter time' })).toBeEnabled();
  await page.getByLabel('Manual time').focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status').filter({ hasText: 'idle' })).toBeVisible();
  const timer = page.getByRole('button', {
    name: 'Press and hold to start; press to split or stop',
  });
  await timer.click();
  await expect(page.getByRole('status').filter({ hasText: 'idle' })).toBeVisible();
  const mobileContext = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const mobile = await mobileContext.newPage();
  await mobile.goto('/timer');
  await expect(mobile.getByRole('button', { name: 'Enter time' })).toBeEnabled();
  const control = mobile.getByRole('button', {
    name: 'Press and hold to start; press to split or stop',
  });
  await control.scrollIntoViewIfNeeded();
  const box = (await control.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await mobile.touchscreen.tap(x, y);
  await expect(mobile.getByRole('status').filter({ hasText: 'idle' })).toBeVisible();
  const cdp = await mobileContext.newCDPSession(mobile);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await expect(mobile.getByRole('status').filter({ hasText: /^ready ·/ })).toBeVisible();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(mobile.getByRole('status').filter({ hasText: 'running' })).toBeVisible();
  await mobile.touchscreen.tap(x, y);
  await expect(mobile.getByText(/Confirm result/)).toBeVisible();
  await mobileContext.close();
});
test('newer scramble wins over a delayed old request', async ({ page }) => {
  await page.route('**/api/cube?**', async (route) => {
    if (new URL(route.request().url()).searchParams.get('scramble') === 'R')
      await new Promise((r) => setTimeout(r, 600));
    await route.continue();
  });
  await page.goto('/solve?scramble=R&parity=1');
  await page.locator('#scramble').fill('U2');
  await page.getByRole('button', { name: /^Apply/ }).click();
  await expect(page.getByText('Verified solved', { exact: true })).toBeVisible();
  await page.waitForTimeout(700);
  await expect(page.locator('#scramble')).toHaveValue('U2');
  await expect(page).toHaveURL(/scramble=U2/);
});
test('backup restoration validates before writing and preserves complete state', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('test.seeded')) {
      localStorage.setItem('bld.speed', '10');
      localStorage.setItem('test.seeded', '1');
    }
  });
  await page.goto('/settings');
  await page.getByLabel('Feedback draft').fill('Saved feedback');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all local data' }).click();
  const file = await downloadPromise;
  const path = await file.path();
  expect(path).toBeTruthy();
  await page.getByLabel('Feedback draft').fill('Changed');
  await page.getByLabel('Restore backup', { exact: true }).setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole('alert')).toContainText('Unsupported backup');
  await expect(page.getByLabel('Feedback draft')).toHaveValue('Changed');
  await page.getByLabel('Restore backup', { exact: true }).setInputFiles(path!);
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await expect(page.getByLabel('Feedback draft')).toHaveValue('Saved feedback');
  await page.goto('/solve?scramble=R');
  await expect(
    page
      .getByRole('group', { name: 'Speed, turns per second' })
      .getByRole('button', { name: '10', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});
