/**
 * `npm run cms:validate` — runs the CMS validators over every stored row.
 * Exits non-zero on any error so this can gate a release/export.
 */
import {
  validatePostRow, validateTourRow,
  type CmsPostRow, type CmsTourRow
} from '../src/cms/model';
import { parseCliOptions, query } from './cms-d1';

const options = parseCliOptions(process.argv.slice(2));

const tours = query<CmsTourRow>(`SELECT * FROM cms_tours WHERE status != 'archived'`, options);
const posts = query<CmsPostRow>(`SELECT * FROM cms_posts WHERE status != 'archived'`, options);

let errors = 0;
let warnings = 0;

for (const row of tours) {
  const outcome = validateTourRow(row);
  for (const issue of outcome.errors) {
    errors += 1;
    console.log(`ERROR   tour ${row.id} · ${issue.field}: ${issue.message}`);
  }
  for (const issue of outcome.warnings) {
    warnings += 1;
    console.log(`warning tour ${row.id} · ${issue.field}: ${issue.message}`);
  }
}

for (const row of posts) {
  const outcome = validatePostRow(row);
  for (const issue of outcome.errors) {
    errors += 1;
    console.log(`ERROR   post ${row.id} · ${issue.field}: ${issue.message}`);
  }
  for (const issue of outcome.warnings) {
    warnings += 1;
    console.log(`warning post ${row.id} · ${issue.field}: ${issue.message}`);
  }
}

console.log(`\ncms:validate — ${tours.length} tours, ${posts.length} posts · ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
