import { test as base } from '@playwright/test';
import { ApiClient, Appointment } from '../api/api-client';
import { STORAGE_STATE } from '../config/env';
import { AppointmentsPage } from '../pages/appointments.page';
import { BookAppointmentPage } from '../pages/book-appointment.page';
import { LoginPage } from '../pages/login.page';
import { futureWeekday } from '../utils/dates';

type Fixtures = {
  loginPage: LoginPage;
  bookPage: BookAppointmentPage;
  appointmentsPage: AppointmentsPage;
  /** Backend client authenticated as the test patient (data setup and checks only). */
  api: ApiClient;
  /** Unique note that identifies the data created by the current test. */
  note: string;
  /** Registers an appointment id to be deleted after the test, pass or fail. */
  cleanup: (appointmentId: number) => void;
  /** An active appointment created through the API for this test, deleted afterwards. */
  testAppointment: Appointment;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  bookPage: async ({ page }, use) => use(new BookAppointmentPage(page)),
  appointmentsPage: async ({ page }, use) => use(new AppointmentsPage(page)),

  api: async ({}, use) => {
    const api = await ApiClient.withToken(ApiClient.tokenFromStorageState(STORAGE_STATE));
    await use(api);
    await api.dispose();
  },

  note: async ({}, use) => {
    await use(`e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  },

  cleanup: async ({ api }, use) => {
    const ids: number[] = [];
    await use((id) => ids.push(id));
    for (const id of ids) {
      await api.deleteAppointment(id);
    }
  },

  testAppointment: async ({ api, note, cleanup }, use) => {
    const [doctor] = await api.listDoctors();
    const date = futureWeekday(30);
    const [timeSlot] = await api.availability(doctor.id, date);
    const appointment = await api.createAppointment({
      doctor_id: doctor.id,
      appointment_date: date,
      time_slot: timeSlot,
      notes: note,
    });
    cleanup(appointment.id);
    await use(appointment);
  },
});

export { expect } from '@playwright/test';
