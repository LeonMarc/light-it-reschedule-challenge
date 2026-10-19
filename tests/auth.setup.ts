import { expect, test as setup } from '@playwright/test';
import { env, STORAGE_STATE } from '../src/config/env';
import { LoginPage } from '../src/pages/login.page';

// Logs in once through the UI and saves the session (the JWT the app keeps in
// localStorage). Every other test starts already authenticated.
setup('authenticate as the test patient', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(env.email, env.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: STORAGE_STATE });
});
