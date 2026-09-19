/**
 * Disposable application server for the Playwright suite.
 *
 * Started by Playwright's `webServer`, this boots a real `wrangler dev` against
 * a throwaway local D1 so the end-to-end tests exercise the actual Worker API —
 * including the booking submit path — without writing to the developer's
 * `.wrangler/state` or leaving rows behind.
 *
 * Two details that are easy to get wrong:
 *
 * 1. `RATE_LIMIT_MAX_REQUESTS` is raised for this instance only. The real limit
 *    is 5 per 10 minutes per client, and the suite makes several successful
 *    inquiries from one address. Leaving it at 5 would make the suite pass on a
 *    cold database and fail on a re-run inside the same window — a flake that
 *    looks like an application bug. Rate limiting itself is covered properly in
 *    `tests/worker/api.test.ts`.
 *
 * 2. `wrangler dev` spawns a chain (npx -> wrangler -> wrangler-cli -> workerd).
 *    Killing only the direct child leaves an orphaned workerd holding the port,
 *    so teardown kills the whole tree. A forced kill can bypass the cleanup
 *    handlers entirely, so stale directories from earlier runs are pruned on
 *    startup as well.
 */

import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const PORT = Number(process.env.E2E_PORT ?? 8788);
const PREFIX = 'travision-e2e-';

function pruneStaleDirectories() {
  try {
    for (const entry of readdirSync(tmpdir())) {
      if (!entry.startsWith(PREFIX)) continue;
      try {
        rmSync(path.join(tmpdir(), entry), { recursive: true, force: true });
      } catch {
        /* still held by a dying process; the next run will get it */
      }
    }
  } catch {
    /* a missing temp dir is not a problem */
  }
}

function killTree(pid) {
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    /* already gone */
  }
}

pruneStaleDirectories();

const persistDir = mkdtempSync(path.join(tmpdir(), PREFIX));
const wranglerCli = path.resolve('node_modules/wrangler/bin/wrangler.js');
console.log(`[serve] disposable D1 at ${persistDir}`);

execFileSync(
  process.execPath,
  [wranglerCli, 'd1', 'migrations', 'apply', 'travision-tours', '--local', '--persist-to', persistDir],
  { stdio: 'pipe' }
);
console.log('[serve] migrations applied');

const child = spawn(
  process.execPath,
  [
    wranglerCli,
    'dev',
    '--port',
    String(PORT),
    '--persist-to',
    persistDir,
    '--var',
    'RATE_LIMIT_MAX_REQUESTS:1000'
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] }
);

// Surface wrangler's output so a startup failure is diagnosable from the
// Playwright log rather than presenting as an opaque webServer timeout.
child.stdout.on('data', chunk => process.stdout.write(`[wrangler] ${chunk}`));
child.stderr.on('data', chunk => process.stderr.write(`[wrangler] ${chunk}`));

let cleanedUp = false;
function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  killTree(child.pid);
  try {
    rmSync(persistDir, { recursive: true, force: true });
    console.log(`[serve] removed ${persistDir}`);
  } catch {
    /* best effort */
  }
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    cleanup();
    process.exit(0);
  });
}
process.on('exit', cleanup);
child.on('exit', code => {
  cleanup();
  process.exit(code ?? 0);
});
