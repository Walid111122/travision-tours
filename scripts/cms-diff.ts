/**
 * `npm run cms:diff` — semantic diff between the published CMS rows and the
 * static catalog the build currently ships. Empty output means the CMS and
 * the public source artifacts are in parity.
 */
import { SAMPLE_TOURS } from '../src/constants';
import { DAY_TOURS } from '../src/dayTours';
import { BLOG_POSTS } from '../src/blogPosts';
import {
  diffEntities, rowToPost, rowToTour,
  type CmsPostRow, type CmsTourRow
} from '../src/cms/model';
import { parseCliOptions, query } from './cms-d1';

const options = parseCliOptions(process.argv.slice(2));

const tours = query<CmsTourRow>(`SELECT * FROM cms_tours WHERE status = 'published'`, options);
const posts = query<CmsPostRow>(`SELECT * FROM cms_posts WHERE status = 'published'`, options);

const tourById = new Map(tours.map(row => [row.id, row]));
const postBySlug = new Map(posts.map(row => [row.slug, row]));

let differences = 0;
const sourceTours = [...SAMPLE_TOURS, ...DAY_TOURS];

for (const source of sourceTours) {
  const row = tourById.get(source.id);
  if (!row) {
    differences += 1;
    console.log(`NOT-IN-CMS  tour ${source.id}`);
    continue;
  }
  for (const diff of diffEntities(source.id, source, rowToTour(row))) {
    differences += 1;
    console.log(`DIFF  tour ${source.id} · ${diff.field}`);
    console.log(`      source:   ${JSON.stringify(diff.source)?.slice(0, 160)}`);
    console.log(`      exported: ${JSON.stringify(diff.exported)?.slice(0, 160)}`);
  }
  tourById.delete(source.id);
}

for (const source of BLOG_POSTS) {
  const row = postBySlug.get(source.id);
  if (!row) {
    differences += 1;
    console.log(`NOT-IN-CMS  post ${source.id}`);
    continue;
  }
  for (const diff of diffEntities(source.id, source, rowToPost(row))) {
    differences += 1;
    console.log(`DIFF  post ${source.id} · ${diff.field}`);
    console.log(`      source:   ${JSON.stringify(diff.source)?.slice(0, 160)}`);
    console.log(`      exported: ${JSON.stringify(diff.exported)?.slice(0, 160)}`);
  }
  postBySlug.delete(source.id);
}

for (const id of tourById.keys()) {
  console.log(`CMS-ONLY    tour ${id} (new content not in the static catalog)`);
}
for (const slug of postBySlug.keys()) {
  console.log(`CMS-ONLY    post ${slug} (new content not in the static catalog)`);
}

console.log(`\ncms:diff — ${differences} difference(s) between published CMS rows and static sources`);
process.exit(differences ? 1 : 0);
