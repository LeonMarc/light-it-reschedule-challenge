# MedAppoint - UI automation

End-to-end tests for the MedAppoint patient portal, written with [Playwright](https://playwright.dev) and TypeScript. They cover the three flows that matter most for the user story under test:

> As a patient, I want to reschedule an existing appointment to another available time slot, without having to cancel and book from scratch.

| Flow | Why it matters | Spec |
| --- | --- | --- |
| 1. Login | Every other flow depends on it | `tests/login.spec.ts` |
| 2. Book an appointment | Creates what is later rescheduled | `tests/book-appointment.spec.ts` |
| 3. Reschedule an appointment | The user story itself | `tests/reschedule-appointment.spec.ts` |

## Run from scratch

Requirements: Node.js 18 or later, and Git (or the zip).

```bash
# 1. Install dependencies and the Chromium browser
npm install
npx playwright install chromium

# 2. Configure the test patient
cp .env.example .env          # Windows (cmd): copy .env.example .env
# edit .env and set E2E_EMAIL and E2E_PASSWORD

# 3. Run the suite
npm test

# 4. Open the HTML report (screenshots, video and trace for any failure)
npm run report
```

Other commands: `npm run test:headed` (see the browser), `npm run test:ui` (Playwright UI mode), `npm run typecheck`.

### Environment variables

| Variable | Required | Default |
| --- | --- | --- |
| `E2E_EMAIL` | yes | |
| `E2E_PASSWORD` | yes | |
| `BASE_URL` | no | `https://light-it-qa-challenge.vercel.app` |
| `API_URL` | no | `https://qa-challenge-backend.vercel.app` |

They can also be set in the shell or in CI instead of `.env`. A missing credential stops the run with a message naming the variable.

## What a passing run looks like

Tests tied to known defects are marked with Playwright's [`test.fail()`](https://playwright.dev/docs/api/class-test#test-fail): they are expected to fail today and are reported as passed while the bug exists. When a bug is fixed, its test starts to "unexpectedly pass" and the run goes red, which is the signal to remove the annotation. The suite is green today and still documents every defect it touches.

| Test | Expected today | Bug |
| --- | --- | --- |
| Login: valid credentials | passes | |
| Login: wrong password | passes | |
| Book: appointment appears in the list | passes | |
| Book: list shows the chosen date (`chromium`, Buenos Aires) | expected failure | BUG-02, dates shown one day early west of UTC |
| Book: list shows the chosen date (`chromium-utc`) | passes | proves BUG-02 depends on the time zone |
| Reschedule: appointment moved to another slot | passes | |
| Reschedule: card updates without a reload | expected failure | BUG-01, screen keeps the old values |
| Reschedule: past date cannot be chosen | expected failure | BUG-08, past dates are saved |

Bug IDs refer to the Part 1 functional test report.

## Design decisions

- **Three flows, few tests.** Each test checks one behaviour, end to end, and says why it exists.
- **Independent test data.** Every test creates its own appointment through the API, identifies it by a unique note, and deletes it afterwards even if the test fails (`cleanup` fixture). Tests never depend on seed data, list order or each other.
- **The UI is tested, the API is the oracle.** Actions happen in the browser like a patient would do them. What was stored is then read from the API, so a UI that looks right but saved something else is caught (and the reverse, as in BUG-01).
- **One login per run.** The `setup` project logs in through the UI and saves the session; the other tests reuse it. The login flow itself is tested separately, starting logged out.
- **Realistic context.** Tests run with the `es-AR` locale and the `America/Buenos_Aires` time zone, the context where the challenge was tested. The `chromium-utc` project re-runs the date display test in UTC.
- **Resilient selectors.** `data-testid` where the app provides one, otherwise labels and accessible roles. No CSS classes or XPath. The reschedule form's labels are not linked to their inputs, so those fields are located by type inside the form.
- **Relative dates.** Dates are computed from today (e.g. the next weekday 30 days ahead), so the suite never goes stale.
- **Serial execution.** All tests share one patient account, so they run with one worker.
- **Evidence on failure.** Screenshot, video and trace are kept for failed tests and attached to the HTML report.

## Project structure

```
playwright.config.ts          projects, locale, time zone, reporters
src/config/env.ts             environment variables and their validation
src/api/api-client.ts         backend client for data setup, cleanup and checks
src/fixtures/test.ts          page objects, API client, unique note, test appointment, cleanup
src/pages/                    page objects: login, book appointment, appointments list
src/utils/dates.ts            relative dates and locale-aware formatting
tests/auth.setup.ts           one UI login, session saved for the other tests
tests/*.spec.ts               the three flows
.github/workflows/e2e.yml     CI: runs the suite and uploads the report
```

## CI

`.github/workflows/e2e.yml` runs type checking and the suite on GitHub Actions, on demand or on push to `main`. Add `E2E_EMAIL` and `E2E_PASSWORD` as repository secrets. The HTML report is uploaded as an artifact.

## AI usage

Claude (Anthropic) was used to explore the application's DOM and frontend bundle for stable selectors, draft the project structure and the tests, and review them. The flows, assertions and the decision to mark known bugs with `test.fail()` were reviewed by the author, and the suite was run against the real application before delivery.
