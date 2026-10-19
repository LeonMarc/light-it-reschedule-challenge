import { expect, test } from '../src/fixtures/test';
import { datePart, futureWeekday, pastDate } from '../src/utils/dates';

// Flow 3 - Reschedule an appointment: the user story under test.
// "As a patient, I want to reschedule an existing appointment to another
// available time slot, without having to cancel and book from scratch."
test.describe('Reschedule an appointment', () => {
  test('patient moves an active appointment to another available slot', async ({
    page,
    api,
    appointmentsPage,
    testAppointment,
  }) => {
    const newDate = futureWeekday(42);
    const slots = await api.availability(testAppointment.doctor_id, newDate);
    const newSlot = slots.find((s) => s !== testAppointment.time_slot)!;
    const before = await api.listAppointments();

    await appointmentsPage.goto();
    await appointmentsPage.openReschedule(testAppointment.notes!);
    const response = await appointmentsPage.rescheduleTo(newDate, newSlot);
    expect(response.status()).toBe(200);

    // Same appointment moved: not cancelled and re-created.
    const stored = await api.getAppointment(testAppointment.id);
    expect(datePart(stored.appointment_date)).toBe(newDate);
    expect(stored).toMatchObject({
      id: testAppointment.id,
      time_slot: newSlot,
      doctor_id: testAppointment.doctor_id,
      status: testAppointment.status,
    });
    expect(await api.listAppointments(), 'no appointment added or removed').toHaveLength(before.length);

    // The patient sees the new slot (after a reload, see the next test for BUG-01).
    await page.reload();
    await expect(appointmentsPage.cardSummary(testAppointment.notes!)).toContainText(newSlot);
  });

  test('the card shows the new slot right after confirming, without a reload', async ({
    api,
    appointmentsPage,
    testAppointment,
  }) => {
    test.fail(true, 'BUG-01: the card keeps the old values until the page is reloaded');

    const newDate = futureWeekday(42);
    const slots = await api.availability(testAppointment.doctor_id, newDate);
    const newSlot = slots.find((s) => s !== testAppointment.time_slot)!;

    await appointmentsPage.goto();
    await appointmentsPage.openReschedule(testAppointment.notes!);
    await appointmentsPage.rescheduleTo(newDate, newSlot);

    await expect(appointmentsPage.cardSummary(testAppointment.notes!)).toContainText(newSlot, { timeout: 5_000 });
  });

  test('a date in the past cannot be chosen', async ({ api, appointmentsPage, testAppointment }) => {
    test.fail(true, 'BUG-08: past dates are accepted and saved');

    await appointmentsPage.goto();
    await appointmentsPage.openReschedule(testAppointment.notes!);
    await appointmentsPage.rescheduleTo(pastDate(7), testAppointment.time_slot);

    const stored = await api.getAppointment(testAppointment.id);
    expect(datePart(stored.appointment_date), 'appointment keeps its original date').toBe(
      datePart(testAppointment.appointment_date),
    );
  });
});
