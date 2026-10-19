/**
 * Runs the Postman collection with Newman and turns its result into a CI
 * signal, with the same rule the UI suite applies through test.fail():
 *
 * - assertions tagged [API-xx] describe known defects: they are expected to
 *   fail, are listed in a summary, and do not fail the build;
 * - any other failure (or a script error) is a new problem: the build fails;
 * - a tagged assertion that passes means a defect may be fixed: the build
 *   fails too, so the tag gets removed and the test protects the fix.
 *
 * Credentials come from the same variables as the UI suite (.env or CI secrets).
 */
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const newman = require('newman');

const KNOWN_DEFECT = /^\[(API-\d+)\]/;

const missing = ['E2E_EMAIL', 'E2E_PASSWORD'].filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing environment variable(s): ${missing.join(', ')}. See README.`);
  process.exit(2);
}

const envVar = [
  { key: 'email', value: process.env.E2E_EMAIL },
  { key: 'password', value: process.env.E2E_PASSWORD },
];
if (process.env.API_URL) envVar.push({ key: 'baseUrl', value: process.env.API_URL });

const resultsDir = path.join(__dirname, 'results');
fs.mkdirSync(resultsDir, { recursive: true });

newman.run(
  {
    collection: path.join(__dirname, 'reschedule.postman_collection.json'),
    environment: path.join(__dirname, 'qa-challenge.postman_environment.json'),
    envVar,
    reporters: ['cli', 'junit'],
    reporter: { junit: { export: path.join(resultsDir, 'junit.xml') } },
  },
  (err, summary) => {
    if (err) {
      console.error('Newman could not run the collection:', err);
      process.exit(2);
    }

    const knownByTag = new Map();
    const unexpected = [];
    const nowPassing = [];

    for (const execution of summary.run.executions) {
      for (const assertion of execution.assertions || []) {
        const tag = (assertion.assertion.match(KNOWN_DEFECT) || [])[1];
        const label = `${execution.item.name} > ${assertion.assertion}`;
        if (assertion.skipped) continue;
        if (tag && assertion.error) {
          knownByTag.set(tag, [...(knownByTag.get(tag) || []), label]);
        } else if (tag) {
          nowPassing.push(label);
        } else if (assertion.error) {
          unexpected.push(`${label}: ${assertion.error.message}`);
        }
      }
    }
    // Script errors (test or pre-request) are never expected.
    for (const failure of summary.run.failures) {
      if (!failure.error.test) unexpected.push(`${failure.source?.name || 'script'}: ${failure.error.message}`);
    }

    const tags = [...knownByTag.keys()].sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
    console.log(`\nKnown defects reproduced (${tags.length}): ${tags.join(', ') || 'none'}`);
    for (const tag of tags) console.log(`  ${tag}: ${knownByTag.get(tag).length} failing assertion(s)`);

    if (nowPassing.length) {
      console.log(`\nTagged assertions now PASSING - defect fixed? Remove the tag (${nowPassing.length}):`);
      nowPassing.forEach((line) => console.log(`  - ${line}`));
    }
    if (unexpected.length) {
      console.log(`\nUNEXPECTED failures (${unexpected.length}):`);
      unexpected.forEach((line) => console.log(`  - ${line}`));
    }

    const ok = unexpected.length === 0 && nowPassing.length === 0;
    console.log(ok ? '\nAPI suite OK: only known defects failed.' : '\nAPI suite FAILED.');
    process.exit(ok ? 0 : 1);
  },
);
