import { createClient, Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local if not in process.env
if (!process.env.TURSO_DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const client: Client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

// Auto-initialize tables if needed
let initialized = false;
export async function ensureTablesExist() {
  if (initialized) return;
  try {
    // 1. Reports table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        source_brand TEXT DEFAULT 'AUTO',
        threshold REAL NOT NULL DEFAULT 24.0,
        total_onus INTEGER NOT NULL DEFAULT 0,
        critical_count INTEGER NOT NULL DEFAULT 0,
        warning_count INTEGER NOT NULL DEFAULT 0,
        optimal_count INTEGER NOT NULL DEFAULT 0,
        worst_rx_power REAL,
        items_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // 2. Categories table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE
      );
    `);

    // 3. Snippets table with 3-language columns
    await client.execute(`
      CREATE TABLE IF NOT EXISTS snippets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        content_bangla TEXT,
        content_banglish TEXT,
        content_english TEXT,
        category_id TEXT,
        category_name TEXT,
        tags TEXT,
        is_pinned INTEGER DEFAULT 0,
        copy_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `);

    // Safely add columns if table was created earlier without them
    try { await client.execute('ALTER TABLE snippets ADD COLUMN content_bangla TEXT;'); } catch {}
    try { await client.execute('ALTER TABLE snippets ADD COLUMN content_banglish TEXT;'); } catch {}
    try { await client.execute('ALTER TABLE snippets ADD COLUMN content_english TEXT;'); } catch {}

    initialized = true;
  } catch (err: any) {
    console.warn('Database table auto-init notice:', err.message);
  }
}
