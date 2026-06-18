import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDb, getDb } from './connection.js';

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'migrations',
);

function ensureMigrationsTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function getAppliedMigrationIds(): Set<string> {
  const db = getDb();
  const rows = db.prepare('SELECT id FROM _migrations ORDER BY id').all() as { id: string }[];
  return new Set(rows.map((row) => row.id));
}

function listMigrationFiles(): string[] {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

export function runMigrations(): number {
  ensureMigrationsTable();

  const db = getDb();
  const applied = getAppliedMigrationIds();
  const files = listMigrationFiles();
  let appliedCount = 0;

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const apply = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (id) VALUES (?)').run(file);
    });

    apply();
    appliedCount += 1;
    console.log(`[migrate] applied ${file}`);
  }

  if (appliedCount === 0) {
    console.log('[migrate] no pending migrations');
  }

  return appliedCount;
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  try {
    runMigrations();
  } finally {
    closeDb();
  }
}
