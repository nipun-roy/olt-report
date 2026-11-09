/**
 * OneSky Bulk SMS Template Importer
 * Usage: node bulk-import.js [optional_file_path.json]
 */
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

function getEnv() {
  const env = {};
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        env[trimmed.substring(0, idx).trim()] = val;
      }
    }
  }
  return env;
}

async function syncToDb(url, authToken, label, templates) {
  console.log(`\n======================================================`);
  console.log(`📡 Connecting to [${label}]: ${url.substring(0, 30)}...`);
  console.log(`======================================================`);

  try {
    const client = createClient({ url, authToken });

    // Ensure tables exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE
      );
    `);

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

    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < templates.length; i++) {
      const item = templates[i];
      const title = (item.title || item.Title || '').trim();
      const bn = (item.contentBangla || item.Bangla || item.bangla || item.content || '').trim();
      const bng = (item.contentBanglish || item.Banglish || item.banglish || '').trim();
      const en = (item.contentEnglish || item.English || item.english || '').trim();
      const catName = (item.categoryName || item.Category || item.category || 'General').trim();
      const tags = (item.tags || item.Tags || '').trim();
      const isPinned = item.isPinned ? 1 : 0;
      const main = bn || bng || en;

      if (!title || !main) continue;

      // Check if existing
      const existing = await client.execute({
        sql: `SELECT id FROM snippets WHERE title = ?`,
        args: [title],
      });

      if (existing.rows.length > 0) {
        const existingId = existing.rows[0].id;
        await client.execute({
          sql: `UPDATE snippets 
                SET content = ?, content_bangla = ?, content_banglish = ?, content_english = ?,
                    category_name = ?, tags = ?
                WHERE id = ?`,
          args: [main, bn || main, bng, en, catName, tags, existingId],
        });
        updated++;
        console.log(`  🔄 [Updated] ${title}`);
      } else {
        const id = item.id || `snip_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
        await client.execute({
          sql: `INSERT INTO snippets (id, title, content, content_bangla, content_banglish, content_english, category_name, tags, is_pinned, copy_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
          args: [id, title, main, bn || main, bng, en, catName, tags, isPinned, Date.now()],
        });
        inserted++;
        console.log(`  ✨ [Inserted] ${title}`);
      }
    }

    console.log(`✅ [${label}] Finished: ${inserted} new inserted, ${updated} updated!`);
  } catch (err) {
    console.error(`❌ [${label}] Error:`, err.message);
  }
}

async function main() {
  const filePath = process.argv[2] || 'bulk-templates.json';
  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Template file not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading templates from: ${fullPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  let templates;
  try {
    templates = JSON.parse(content);
  } catch (e) {
    console.error('❌ Invalid JSON in template file:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(templates)) {
    console.error('❌ Template file must contain a JSON array [ ... ]');
    process.exit(1);
  }

  console.log(`🚀 Found ${templates.length} templates to import.`);

  // 1. Local SQLite
  await syncToDb('file:local.db', undefined, 'Local SQLite (local.db)', templates);

  // 2. Turso Cloud (if available)
  const env = getEnv();
  if (env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN) {
    await syncToDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN, 'Turso Cloud Database', templates);
  } else {
    console.log('ℹ️ Turso Cloud not configured or skipped.');
  }

  console.log('\n🎉 Bulk import complete!\n');
}

main().catch(console.error);
