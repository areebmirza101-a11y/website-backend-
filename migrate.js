/**
 * migrate.js — Run all pending migrations against Supabase (PostgreSQL)
 *
 * Usage:  node migrate.js
 *
 * Keeps a `_migrations` table in the DB to track which files have already
 * been applied, so re-running is always safe (idempotent).
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to database.\n');

  // Create tracking table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      id         BIGSERIAL PRIMARY KEY,
      filename   TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Collect migration files in order
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found in', MIGRATIONS_DIR);
    await client.end();
    return;
  }

  // Find already-applied migrations
  const { rows: applied } = await client.query(
    'SELECT filename FROM public._migrations'
  );
  const appliedSet = new Set(applied.map(r => r.filename));

  let pendingCount = 0;

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`  [skip]    ${file}  (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`  [running] ${file} ...`);

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO public._migrations (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`  [done]    ${file}`);
      pendingCount++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  [FAILED]  ${file}`);
      console.error('           ', err.message);
      await client.end();
      process.exit(1);
    }
  }

  console.log(
    pendingCount === 0
      ? '\nAll migrations already applied. Nothing to do.'
      : `\n${pendingCount} migration(s) applied successfully.`
  );

  await client.end();
}

run().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
