import AxeBuilder from '@axe-core/playwright';
import { Page, TestInfo } from '@playwright/test';
import { KNOWN_VIOLATIONS, Screen, WCAG_TAGS } from '../src/a11y/known-violations';
import { expect, test } from '../src/fixtures/test';

// Extra: automated accessibility check (axe-core, WCAG 2.1 A and AA) of every
// screen in the reschedule journey. Known violations are a documented baseline;
// a new violation fails the test, and so does a known one that disappears.

async function checkScreen(page: Page, screen: Screen, testInfo: TestInfo): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await testInfo.attach(`axe-${screen.replace(/ /g, '-')}.json`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });

  const known = KNOWN_VIOLATIONS[screen];
  const found = results.violations.map((v) => v.id);
  const unexpected = results.violations
    .filter((v) => !(v.id in known))
    .map((v) => `${v.id} (${v.impact}, ${v.nodes.length} element(s)): ${v.help}`);
  const fixed = Object.keys(known).filter((id) => !found.includes(id));

  for (const id of found.filter((id) => id in known)) {
    testInfo.annotations.push({ type: 'known a11y issue', description: `${screen}: ${known[id]}` });
  }
  expect(unexpected, `new accessibility violations on "${screen}"`).toEqual([]);
  expect(fixed, `known violations no longer found on "${screen}": update the baseline`).toEqual([]);
}

test.describe('Accessibility (WCAG 2.1 A/AA)', () => {
  test.describe('logged out', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login screen', async ({ page, loginPage }, testInfo) => {
      await loginPage.goto();
      await expect(loginPage.email).toBeVisible();
      await checkScreen(page, 'login', testInfo);
    });
  });

  test('dashboard', async ({ page }, testInfo) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('upcoming-count')).toBeVisible();
    await checkScreen(page, 'dashboard', testInfo);
  });

  test('book appointment screen', async ({ page, bookPage }, testInfo) => {
    await bookPage.goto();
    await checkScreen(page, 'book appointment', testInfo);
  });

  test('appointments list and reschedule form', async ({ page, appointmentsPage, testAppointment }, testInfo) => {
    await appointmentsPage.goto();
    await expect(appointmentsPage.card(testAppointment.notes!)).toBeVisible();
    await checkScreen(page, 'appointments', testInfo);

    await appointmentsPage.openReschedule(testAppointment.notes!);
    await checkScreen(page, 'reschedule form', testInfo);
  });
});
