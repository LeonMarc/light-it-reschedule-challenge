import { env } from '../src/config/env';
import { expect, test } from '../src/fixtures/test';

// Flow 1 - Login. Every other flow depends on it.
test.describe('Login', () => {
  // These tests start logged out.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('patient signs in with valid credentials and reaches the dashboard', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login(env.email, env.password);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('upcoming-count')).toBeVisible();
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token, 'session token stored').toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  test('a wrong password shows an error and keeps the patient logged out', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login(env.email, `${env.password}-wrong`);

    await expect(loginPage.error).toBeVisible();
    await expect(loginPage.error).not.toBeEmpty();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('token')), 'no session token').toBeNull();
  });
});
