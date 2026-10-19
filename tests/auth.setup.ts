import { expect, test as setup } from '@playwright/test';
import { env, STORAGE_STATE } from '../src/config/env';
import { LoginPage } from '../src/pages/login.page';

// Logs in once through the UI and saves the session (the JWT the app keeps in
// localStorage). Every other test starts already authenticated.
setup('authenticate as the test patient', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(env.email, env.password);

  await loginPage.waitForOutcome();
  if (await loginPage.error.isVisible()) {
    throw new Error(
      `Login failed with "${(await loginPage.error.innerText()).replace(/^error\s*/, '')}". ` +
        'Check E2E_EMAIL and E2E_PASSWORD in .env. Wrap values that contain # in double quotes, e.g. E2E_PASSWORD="abc#123".',
    );
  }
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: STORAGE_STATE });
});
