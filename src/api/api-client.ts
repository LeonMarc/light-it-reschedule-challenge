import { APIRequestContext, APIResponse, request } from '@playwright/test';
import fs from 'node:fs';
import { env } from '../config/env';

export type AppointmentStatus = 'active' | 'pending' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  /** Returned as an ISO date-time at midnight UTC, e.g. 2026-11-25T00:00:00.000Z */
  appointment_date: string;
  time_slot: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialty: string;
}

export interface NewAppointment {
  doctor_id: number;
  appointment_date: string;
  time_slot: string;
  notes: string;
}

/**
 * Thin client for the backend, used only to prepare and clean up test data
 * and to check what was really stored. The flows themselves run in the UI.
 */
export class ApiClient {
  private constructor(private readonly ctx: APIRequestContext) {}

  static async withToken(token: string): Promise<ApiClient> {
    const ctx = await request.newContext({
      baseURL: `${env.apiUrl}/api/`,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    return new ApiClient(ctx);
  }

  /** Reads the JWT the app stored in localStorage during the setup login. */
  static tokenFromStorageState(path: string): string {
    const state = JSON.parse(fs.readFileSync(path, 'utf8')) as {
      origins: { origin: string; localStorage: { name: string; value: string }[] }[];
    };
    const origin = new URL(env.baseUrl).origin;
    const token = state.origins
      .find((o) => o.origin === origin)
      ?.localStorage.find((item) => item.name === 'token')?.value;
    if (!token) {
      throw new Error(`No session token found in ${path}. Run the "setup" project first.`);
    }
    return token;
  }

  async listDoctors(): Promise<Doctor[]> {
    return this.json(await this.ctx.get('doctors'));
  }

  async availability(doctorId: number, date?: string): Promise<string[]> {
    const response = await this.ctx.get(`doctors/${doctorId}/availability`, {
      params: date ? { date } : undefined,
    });
    return (await this.json<{ time_slots: string[] }>(response)).time_slots;
  }

  async listAppointments(): Promise<Appointment[]> {
    return this.json(await this.ctx.get('appointments'));
  }

  async getAppointment(id: number): Promise<Appointment> {
    return this.json(await this.ctx.get(`appointments/${id}`));
  }

  async createAppointment(data: NewAppointment): Promise<Appointment> {
    return this.json(await this.ctx.post('appointments', { data }));
  }

  /** Idempotent: a missing appointment is not an error during cleanup. */
  async deleteAppointment(id: number): Promise<void> {
    const response = await this.ctx.delete(`appointments/${id}`);
    if (!response.ok() && response.status() !== 404) {
      throw new Error(`Cleanup failed for appointment ${id}: ${response.status()} ${await response.text()}`);
    }
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }

  private async json<T>(response: APIResponse): Promise<T> {
    if (!response.ok()) {
      throw new Error(`${response.url()} -> ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as T;
  }
}
