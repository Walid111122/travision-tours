import { describe, expect, it } from 'vitest';
import { SAMPLE_TOURS } from '../../src/constants';
import { DAY_TOURS } from '../../src/dayTours';
import { BLOG_POSTS } from '../../src/blogPosts';
import {
  diffEntities,
  findUnsafeMarkup,
  insertPostStatement,
  insertTourStatement,
  postToRow,
  rowToPost,
  rowToTour,
  serializePostsModule,
  serializeToursModule,
  tourToRow,
  validatePostRow,
  validateTourRow,
  SLUG_PATTERN
} from '../../src/cms/model';

const NOW = '2026-09-16T00:00:00.000Z';

describe('CMS tour round-trip parity', () => {
  const all = [
    ...SAMPLE_TOURS.map(t => ({ tour: t, collection: 'package' as const })),
    ...DAY_TOURS.map(t => ({ tour: t, collection: 'day_tour' as const }))
  ];

  it('covers the full static catalog', () => {
    expect(all.length).toBe(34);
  });

  it.each(all)('$tour.id survives row mapping unchanged', ({ tour, collection }) => {
    const row = tourToRow(tour, collection, 'seed', NOW);
    const diffs = diffEntities(tour.id, tour, rowToTour(row));
    expect(diffs).toEqual([]);
  });

  it('seeded rows carry published status and locked slugs', () => {
    const row = tourToRow(SAMPLE_TOURS[0], 'package', 'seed', NOW);
    expect(row.status).toBe('published');
    expect(row.slug_locked).toBe(1);
    expect(row.published_revision_no).toBe(1);
    expect(row.canonical_path).toBe(`/tours/${SAMPLE_TOURS[0].id}`);
  });
});

describe('CMS post round-trip parity', () => {
  it.each(BLOG_POSTS.map(post => [post.id, post] as const))('%s survives row mapping unchanged', (_id, post) => {
    const row = postToRow(post, 'seed', NOW);
    const diffs = diffEntities(post.id, post, rowToPost(row));
    expect(diffs).toEqual([]);
  });
});

describe('insert statements are idempotent and escaped', () => {
  it('uses ON CONFLICT DO NOTHING', () => {
    const row = tourToRow(SAMPLE_TOURS[0], 'package', 'seed', NOW);
    expect(insertTourStatement(row)).toContain('ON CONFLICT (id) DO NOTHING');
    const post = postToRow(BLOG_POSTS[0], 'seed', NOW);
    expect(insertPostStatement(post)).toContain('ON CONFLICT (id) DO NOTHING');
  });

  it('escapes single quotes in text', () => {
    const row = tourToRow(SAMPLE_TOURS[0], 'package', 'seed', NOW);
    row.title = "It's a test";
    expect(insertTourStatement(row)).toContain("It''s a test");
  });
});

describe('export serialization is deterministic', () => {
  const rows = SAMPLE_TOURS.slice(0, 3).map(t => tourToRow(t, 'package', 'seed', NOW));

  it('produces identical output for identical input', () => {
    expect(serializeToursModule(rows, 'GENERATED_PACKAGES')).toBe(
      serializeToursModule(rows, 'GENERATED_PACKAGES')
    );
  });

  it('serializes posts deterministically too', () => {
    const posts = BLOG_POSTS.slice(0, 2).map(p => postToRow(p, 'seed', NOW));
    expect(serializePostsModule(posts)).toBe(serializePostsModule(posts));
    expect(serializePostsModule(posts)).toContain('GENERATED_BLOG_POSTS');
  });
});

describe('tour validation', () => {
  const valid = tourToRow(SAMPLE_TOURS[0], 'package', 'seed', NOW);

  it('accepts a well-formed row', () => {
    expect(validateTourRow(valid).errors).toEqual([]);
  });

  it('rejects a malformed id', () => {
    expect(validateTourRow({ ...valid, id: 'Not A Slug!' }).errors.length).toBeGreaterThan(0);
  });

  it('rejects a negative price', () => {
    expect(validateTourRow({ ...valid, price: -5 }).errors.map(e => e.field)).toContain('price');
  });

  it('rejects malformed itinerary JSON', () => {
    expect(validateTourRow({ ...valid, itinerary: '{oops' }).errors.map(e => e.field)).toContain('itinerary');
  });

  it('rejects an itinerary day without content', () => {
    const itinerary = JSON.stringify([{ day: 1, title: '', description: '' }]);
    expect(validateTourRow({ ...valid, itinerary }).errors.length).toBeGreaterThan(0);
  });

  it('rejects a remote cover image that is not https', () => {
    expect(validateTourRow({ ...valid, cover_image: 'http://evil.example/x.jpg' }).errors.length).toBeGreaterThan(0);
  });

  it('rejects unsafe markup in text fields', () => {
    expect(
      validateTourRow({ ...valid, notes: 'nice <script>alert(1)</script>' }).errors.length
    ).toBeGreaterThan(0);
  });

  it('flags a missing cover image as a warning, not an error', () => {
    const outcome = validateTourRow({ ...valid, cover_image: '' });
    expect(outcome.errors).toEqual([]);
    expect(outcome.warnings.map(w => w.field)).toContain('cover_image');
  });
});

describe('post validation', () => {
  const valid = postToRow(BLOG_POSTS[0], 'seed', NOW);

  it('accepts a well-formed row', () => {
    expect(validatePostRow(valid).errors).toEqual([]);
  });

  it('rejects a bad slug', () => {
    expect(validatePostRow({ ...valid, slug: 'Has Spaces' }).errors.length).toBeGreaterThan(0);
  });

  it('rejects a # heading inside the body', () => {
    expect(validatePostRow({ ...valid, content: '# Nope\n\nbody' }).errors.length).toBeGreaterThan(0);
  });

  it('rejects ### before any ##', () => {
    expect(validatePostRow({ ...valid, content: 'intro\n\n### early\n\n## late' }).errors.length).toBeGreaterThan(0);
  });

  it('warns when no internal link exists', () => {
    const outcome = validatePostRow({ ...valid, content: 'Just text, no links.' });
    expect(outcome.warnings.some(w => w.message.includes('internal link'))).toBe(true);
  });

  it('rejects script injection in content', () => {
    expect(
      validatePostRow({ ...valid, content: 'text <script>alert(1)</script>' }).errors.length
    ).toBeGreaterThan(0);
  });
});

describe('unsafe markup detection', () => {
  it('catches scripts, iframes, handlers and javascript: URLs', () => {
    expect(findUnsafeMarkup('<script>x</script>')).toBeTruthy();
    expect(findUnsafeMarkup('<IFRAME src=x>')).toBeTruthy();
    expect(findUnsafeMarkup('<img onerror=x>')).toBeTruthy();
    expect(findUnsafeMarkup('javascript:alert(1)')).toBeTruthy();
    expect(findUnsafeMarkup('plain safe text')).toBeNull();
  });
});

describe('slug pattern', () => {
  it('accepts real catalog ids including consecutive dashes', () => {
    for (const tour of [...SAMPLE_TOURS, ...DAY_TOURS]) {
      expect(SLUG_PATTERN.test(tour.id), tour.id).toBe(true);
    }
  });

  it('rejects unsafe ids', () => {
    expect(SLUG_PATTERN.test('../etc')).toBe(false);
    expect(SLUG_PATTERN.test('UPPER')).toBe(false);
    expect(SLUG_PATTERN.test('has space')).toBe(false);
    expect(SLUG_PATTERN.test('-leading')).toBe(false);
  });
});
