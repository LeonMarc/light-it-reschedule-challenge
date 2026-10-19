const DAY_MS = 24 * 60 * 60 * 1000;

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A weekday (Monday to Friday) at least `daysAhead` days from today, as
 * YYYY-MM-DD. Tests use relative dates so they never go stale.
 */
export function futureWeekday(daysAhead: number): string {
  let date = new Date(todayUtc().getTime() + daysAhead * DAY_MS);
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date = new Date(date.getTime() + DAY_MS);
  }
  return toIsoDate(date);
}

/** A date `daysAgo` days before today, as YYYY-MM-DD. */
export function pastDate(daysAgo: number): string {
  return toIsoDate(new Date(todayUtc().getTime() - daysAgo * DAY_MS));
}

/** The calendar day part of the API value (2026-11-25T00:00:00.000Z -> 2026-11-25). */
export function datePart(apiDate: string): string {
  return apiDate.slice(0, 10);
}

/**
 * How a patient expects to read a calendar date in their locale: the same day
 * they picked, whatever their time zone. E.g. 2026-11-25 in es-AR -> 25/11/2026.
 */
export function displayDate(isoDate: string, locale: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(locale, { timeZone: 'UTC' });
}
