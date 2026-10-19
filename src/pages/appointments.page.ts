import { expect, Locator, Page, Response } from '@playwright/test';

/**
 * Appointments list. Each test identifies its appointment by a unique note,
 * so the page object never depends on list order (which the app does not keep
 * stable, BUG-11) or on pre-existing data.
 */
export class AppointmentsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/appointments');
    await expect(this.page.getByRole('heading', { name: 'Appointments', exact: true })).toBeVisible();
  }

  /** The row of the appointment whose note is `note` (innermost block holding the note and its buttons). */
  card(note: string): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByText(note, { exact: true }) })
      .filter({ has: this.page.getByRole('button', { name: 'Reschedule' }) })
      .last();
  }

  /** The "date • time" line of a card, e.g. "25/11/2026 • 15:30". */
  cardSummary(note: string): Locator {
    return this.card(note).locator('p').first();
  }

  /**
   * The inline reschedule form. Only one can be open at a time. Its "New Date"
   * and "New Time" labels are not linked to their fields (no `for`), so the
   * fields are located by type inside the form.
   */
  private get rescheduleForm(): Locator {
    return this.page.getByText('Reschedule to:', { exact: true }).locator('..');
  }

  async openReschedule(note: string): Promise<void> {
    await this.card(note).getByRole('button', { name: 'Reschedule' }).click();
    // The form can open below the fold (IMP-03): bring it into view like a user would.
    await this.rescheduleForm.scrollIntoViewIfNeeded();
    await expect(this.rescheduleForm).toBeVisible();
  }

  /** Fills the open form, confirms, and returns the server response to the save. */
  async rescheduleTo(date: string, timeSlot: string): Promise<Response> {
    const form = this.rescheduleForm;
    await form.locator('input[type="date"]').fill(date);
    const slot = form.locator('select');
    await expect(slot.locator(`option[value="${timeSlot}"]`)).toHaveCount(1);
    await slot.selectOption(timeSlot);
    const saved = this.page.waitForResponse(
      (r) => r.url().includes('/reschedule') && r.request().method() === 'PUT',
    );
    await form.getByRole('button', { name: 'Confirm' }).click();
    return saved;
  }
}
