/**
 * `npm run cms:export` — deterministic export of published CMS content into
 * `src/generated/`. These artifacts are what a future build step will consume
 * instead of the hand-maintained catalog; the deterministic serialization
 * means unchanged content produces byte-identical files and zero git diff.
 *
 * Nothing is deployed: this only writes source files.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  serializeToursModule, serializePostsModule,
  type CmsTourRow, type CmsPostRow
} from '../src/cms/model';
import { parseCliOptions, query, runSqlFile } from './cms-d1';

const options = parseCliOptions(process.argv.slice(2));
const now = new Date().toISOString();

const tours = query<CmsTourRow>(
  `SELECT * FROM cms_tours WHERE status = 'published' ORDER BY display_order ASC, id ASC`,
  options
);
const posts = query<CmsPostRow>(
  `SELECT * FROM cms_posts WHERE status = 'published' ORDER BY published_at ASC, slug ASC`,
  options
);

const packages = tours.filter(row => row.collection === 'package');
const dayTours = tours.filter(row => row.collection === 'day_tour');

const outDir = path.resolve('src/generated');
mkdirSync(outDir, { recursive: true });

writeFileSync(path.join(outDir, 'packages.ts'), serializeToursModule(packages, 'GENERATED_PACKAGES'));
writeFileSync(path.join(outDir, 'day-tours.ts'), serializeToursModule(dayTours, 'GENERATED_DAY_TOURS'));
writeFileSync(path.join(outDir, 'blog-posts.ts'), serializePostsModule(posts));

console.log(`Exported ${packages.length} packages, ${dayTours.length} day tours, ${posts.length} posts → src/generated/`);

runSqlFile(
  `INSERT INTO cms_release_jobs (kind, status, summary, actor, created_at)
   VALUES ('export', 'succeeded', '${packages.length + dayTours.length} tours / ${posts.length} posts', 'cms-export', '${now}');`,
  options
);
