import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Thin wrapper over `wrangler d1 execute --local` shared by the cms:* CLI
 * scripts. Scripts operate on the developer's local database in
 * `.wrangler/state` by default; `--persist-to <dir>` retargets any command at
 * a throwaway directory so verification runs never touch real local data.
 */

const WRANGLER = path.resolve('node_modules/wrangler/bin/wrangler.js');
const DB_NAME = 'travision-tours';

export interface CliOptions {
  persistTo?: string;
}

export function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {};
  const flag = argv.indexOf('--persist-to');
  if (flag !== -1) options.persistTo = argv[flag + 1];
  return options;
}

function wranglerArgs(options: CliOptions): string[] {
  const args = [WRANGLER, 'd1', 'execute', DB_NAME, '--local'];
  if (options.persistTo) args.push('--persist-to', options.persistTo);
  return args;
}

/** Execute a multi-statement SQL file against local D1. */
export function runSqlFile(sql: string, options: CliOptions): void {
  const dir = mkdtempSync(path.join(tmpdir(), 'cms-sql-'));
  const file = path.join(dir, 'batch.sql');
  try {
    writeFileSync(file, sql);
    execFileSync(process.execPath, [...wranglerArgs(options), '--file', file], {
      stdio: 'pipe'
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Run a single query and return the result rows. */
export function query<T = Record<string, unknown>>(sql: string, options: CliOptions): T[] {
  const output = execFileSync(
    process.execPath,
    [...wranglerArgs(options), '--json', '--command', sql],
    { stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 }
  ).toString();

  const parsed = JSON.parse(output) as { results?: T[] }[] | { results?: T[] };
  if (Array.isArray(parsed)) return parsed[0]?.results ?? [];
  return parsed.results ?? [];
}

/** Apply migrations to a (possibly fresh) local database directory. */
export function applyMigrations(options: CliOptions): void {
  const args = [WRANGLER, 'd1', 'migrations', 'apply', DB_NAME, '--local'];
  if (options.persistTo) args.push('--persist-to', options.persistTo);
  execFileSync(process.execPath, args, { stdio: 'inherit' });
}
