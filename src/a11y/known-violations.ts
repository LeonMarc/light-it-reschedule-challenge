/**
 * Accessibility violations found on 2026-10-19 with axe-core (WCAG 2.1 A and AA),
 * per screen. They are documented in the Part 1 report (improvements IMP-10 to
 * IMP-13) and act as a baseline: the accessibility test fails when a NEW rule is
 * violated, and also when a known one disappears, so the baseline is updated
 * once it is fixed.
 */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export type Screen = 'login' | 'dashboard' | 'book appointment' | 'appointments' | 'reschedule form';

export const KNOWN_VIOLATIONS: Record<Screen, Record<string, string>> = {
  login: {
    'image-alt': 'IMP-12: the login illustration has no text alternative',
  },
  dashboard: {
    'image-alt': 'IMP-12: the dashboard banner has no text alternative',
    'color-contrast': 'IMP-13: low-contrast secondary text',
  },
  'book appointment': {
    'color-contrast': 'IMP-13: low-contrast helper text',
  },
  appointments: {
    'color-contrast': 'IMP-13: low-contrast secondary text',
  },
  'reschedule form': {
    'color-contrast': 'IMP-13: low-contrast secondary text',
    label: 'IMP-11: the "New Date" field has no associated label',
    'select-name': 'IMP-11: the "New Time" select has no accessible name',
  },
};
