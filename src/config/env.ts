import 'dotenv/config';

/**
 * Single source for configuration. Credentials are read lazily so that
 * commands that do not need them (e.g. `--list`) still work, and a missing
 * value fails with an actionable message instead of a confusing 401.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env and fill it in (see README).`,
    );
  }
  return value;
}

export const env = {
  baseUrl: process.env.BASE_URL || 'https://light-it-qa-challenge.vercel.app',
  apiUrl: process.env.API_URL || 'https://qa-challenge-backend.vercel.app',
  get email(): string {
    return required('E2E_EMAIL');
  },
  get password(): string {
    return required('E2E_PASSWORD');
  },
};

/** Where the setup project stores the logged-in session for the other tests. */
export const STORAGE_STATE = 'playwright/.auth/patient.json';
