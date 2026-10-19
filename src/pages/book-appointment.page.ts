import { expect, Locator, Page } from '@playwright/test';

export interface Booking {
  doctorId: number;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  notes: string;
}

export class BookAppointmentPage {
  readonly doctor: Locator;
  readonly date: Locator;
  readonly timeSlot: Locator;
  readonly notes: Locator;
  readonly submit: Locator;
  readonly success: Locator;

  constructor(private readonly page: Page) {
    this.doctor = page.getByLabel('Doctor', { exact: true });
    this.date = page.getByLabel('Date', { exact: true });
    this.timeSlot = page.getByLabel('Time Slot', { exact: true });
    this.notes = page.getByLabel('Notes (optional)');
    this.submit = page.getByTestId('submit-appointment');
    this.success = page.getByTestId('appointment-success');
  }

  async goto(): Promise<void> {
    await this.page.goto('/appointments/new');
    await expect(this.doctor).toBeVisible();
  }

  async book(booking: Booking): Promise<void> {
    await this.doctor.selectOption(String(booking.doctorId));
    await this.date.fill(booking.date);
    // Time slots load asynchronously after a doctor is chosen.
    await expect(this.timeSlot.locator(`option[value="${booking.timeSlot}"]`)).toHaveCount(1);
    await this.timeSlot.selectOption(booking.timeSlot);
    await this.notes.fill(booking.notes);
    await this.submit.click();
  }
}
