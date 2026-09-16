/**
 * `npm run cms:seed` — one-shot, idempotent bootstrap of the CMS tables from
 * the static catalog. Re-runs are safe: every insert is ON CONFLICT DO
 * NOTHING and the reconciliation pass at the end proves parity.
 *
 * Usage:
 *   npm run cms:seed                 # seeds .wrangler/state
 *   npm run cms:seed -- --persist-to /tmp/dir   # seeds a throwaway local DB
 */
import { writeFileSync } from 'node:fs';
import { SAMPLE_TOURS } from '../src/constants';
import { DAY_TOURS } from '../src/dayTours';
import { BLOG_POSTS } from '../src/blogPosts';
import {
  tourToRow, postToRow, rowToTour, rowToPost, diffEntities,
  insertTourStatement, insertPostStatement,
  insertTourRevisionStatement, insertPostRevisionStatement,
  type CmsTourRow, type CmsPostRow
} from '../src/cms/model';
import { applyMigrations, parseCliOptions, query, runSqlFile } from './cms-d1';

const options = parseCliOptions(process.argv.slice(2));
const now = new Date().toISOString();
const ACTOR = 'cms-seed';

console.log('Applying migrations…');
applyMigrations(options);

const tourRows = [
  ...SAMPLE_TOURS.map(tour => tourToRow(tour, 'package', ACTOR, now)),
  ...DAY_TOURS.map(tour => tourToRow(tour, 'day_tour', ACTOR, now))
];
const postRows = BLOG_POSTS.map(post => postToRow(post, ACTOR, now));

console.log(`Seeding ${tourRows.length} tours and ${postRows.length} posts…`);

const statements = [
  ...tourRows.flatMap(row => [insertTourStatement(row), insertTourRevisionStatement(row)]),
  ...postRows.flatMap(row => [insertPostStatement(row), insertPostRevisionStatement(row)]),
  `INSERT INTO cms_release_jobs (kind, status, summary, actor, created_at)
   VALUES ('seed', 'started', '${tourRows.length} tours / ${postRows.length} posts', '${ACTOR}', '${now}');`
];
runSqlFile(statements.join('\n'), options);

// ---------------------------------------------------------------------------
// Reconciliation — every source entity must exist with identical content.
// ---------------------------------------------------------------------------

const storedTours = query<CmsTourRow>('SELECT * FROM cms_tours', options);
const storedPosts = query<CmsPostRow>('SELECT * FROM cms_posts', options);

const report: string[] = [
  '# CMS seed reconciliation report',
  '',
  `Run at: ${now}`,
  '',
  `Source: ${SAMPLE_TOURS.length} packages + ${DAY_TOURS.length} day tours + ${BLOG_POSTS.length} posts`,
  `Database: ${storedTours.length} tour rows, ${storedPosts.length} post rows`,
  ''
];

let failures = 0;
const byId = new Map(storedTours.map(row => [row.id, row]));
for (const source of [...SAMPLE_TOURS, ...DAY_TOURS]) {
  const row = byId.get(source.id);
  if (!row) {
    report.push(`- MISSING tour \`${source.id}\``);
    failures += 1;
    continue;
  }
  const diffs = diffEntities(source.id, source, rowToTour(row));
  if (diffs.length) {
    failures += 1;
    report.push(`- DIFF tour \`${source.id}\`: ${diffs.map(d => d.field).join(', ')}`);
  }
}

const postById = new Map(storedPosts.map(row => [row.id, row]));
for (const source of BLOG_POSTS) {
  const row = postById.get(source.id);
  if (!row) {
    report.push(`- MISSING post \`${source.id}\``);
    failures += 1;
    continue;
  }
  const diffs = diffEntities(source.id, source, rowToPost(row));
  if (diffs.length) {
    failures += 1;
    report.push(`- DIFF post \`${source.id}\`: ${diffs.map(d => d.field).join(', ')}`);
  }
}

report.push('', failures === 0 ? 'Result: PARITY — all source content is present and identical.' : `Result: ${failures} mismatch(es) — see entries above.`, '');
console.log(report.join('\n'));
writeFileSync('CMS_SEED_REPORT.md', report.join('\n'));

runSqlFile(
  `INSERT INTO cms_release_jobs (kind, status, summary, actor, created_at)
   VALUES ('seed', '${failures === 0 ? 'succeeded' : 'failed'}', '${failures} mismatches', '${ACTOR}', '${new Date().toISOString()}');`,
  options
);

process.exit(failures === 0 ? 0 : 1);
