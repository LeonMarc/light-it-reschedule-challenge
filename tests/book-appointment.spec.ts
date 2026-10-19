import { expect, test } from '../src/fixtures/test';
import { datePart, displayDate, futureWeekday } from '../src/utils/dates';

// Flow 2 - Book an appointment: the entry point of everything that is later
// rescheduled.
test.describe('Book an appointment', () => {
  test('patient books an appointment and finds it in the list', async ({
    api,
    bookPage,
    appointmentsPage,
    note,
    cleanup,
  }) => {
    const [doctor] = await api.listDoctors();
    const date = futureWeekday(35);
    const [timeSlot] = await api.availability(doctor.id, date);

    await bookPage.goto();
    await bookPage.book({ doctorId: doctor.id, date, timeSlot, notes: note });
    await expect(bookPage.success).toBeVisible();

    // What was stored: the source of truth for the rest of the checks.
    const created = (await api.listAppointments()).find((a) => a.notes === note);
    expect(created, 'appointment stored for the patient').toBeDefined();
    cleanup(created!.id);
    expect(created).toMatchObject({ doctor_id: doctor.id, time_slot: timeSlot, status: 'active' });
    expect(datePart(created!.appointment_date)).toBe(date);

    await appointmentsPage.goto();
    await expect(appointmentsPage.card(note)).toBeVisible();
    await expect(appointmentsPage.cardSummary(note)).toContainText(timeSlot);
  });

  test('the list shows the date the patient chose @timezone', async ({
    page,
    appointmentsPage,
    testAppointment,
  }, testInfo) => {
    // Dates are stored as midnight UTC and converted to local time on display,
    // so any time zone west of UTC sees the previous day. In UTC it passes.
    const offsetMinutes = await page.evaluate(() => new Date().getTimezoneOffset());
    test.fail(offsetMinutes > 0, 'BUG-02: dates are displayed one day early west of UTC');

    const expected = displayDate(datePart(testAppointment.appointment_date), testInfo.project.use.locale ?? 'en-US');

    await appointmentsPage.goto();
    await expect(appointmentsPage.cardSummary(testAppointment.notes!)).toContainText(expected, { timeout: 5_000 });
  });
});
