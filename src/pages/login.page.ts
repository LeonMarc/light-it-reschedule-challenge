import { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: /sign in/i });
    this.error = page.getByTestId('login-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /** Waits until the login either reaches the dashboard or shows an error. */
  async waitForOutcome(): Promise<void> {
    await Promise.race([
      this.page.waitForURL(/\/dashboard$/, { timeout: 15_000 }),
      this.error.waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => {
      /* neither happened: the URL assertion that follows reports it */
    });
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
