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

    // 3. Snippets table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS snippets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category_id TEXT,
        category_name TEXT,
        tags TEXT,
        is_pinned INTEGER DEFAULT 0,
        copy_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `);

    // Seed default categories and snippets if empty
    const catCheck = await client.execute('SELECT COUNT(*) as cnt FROM categories');
    if (catCheck.rows[0] && Number(catCheck.rows[0].cnt) === 0) {
      await client.execute(`
        INSERT INTO categories (id, name, slug) VALUES
        ('cat_payment', 'Payment (পেমেন্ট)', 'payment'),
        ('cat_billing', 'Billing & Due (বিল বকেয়া)', 'billing'),
        ('cat_maintenance', 'Maintenance Alert (রক্ষণাবেক্ষণ)', 'maintenance'),
        ('cat_support', 'Support & Line Issue (সাপোর্ট)', 'support'),
        ('cat_welcome', 'New Customer (নতুন সংযোগ)', 'welcome');
      `);
    }

    const snipCheck = await client.execute('SELECT COUNT(*) as cnt FROM snippets');
    if (snipCheck.rows[0] && Number(snipCheck.rows[0].cnt) === 0) {
      const now = Date.now();
      await client.execute({
        sql: `INSERT INTO snippets (id, title, content, category_id, category_name, tags, is_pinned, copy_count, created_at)
              VALUES 
              (?, ?, ?, ?, ?, ?, 1, 14, ?),
              (?, ?, ?, ?, ?, ?, 1, 9, ?),
              (?, ?, ?, ?, ?, ?, 0, 5, ?),
              (?, ?, ?, ?, ?, ?, 0, 3, ?),
              (?, ?, ?, ?, ?, ?, 0, 7, ?);`,
        args: [
          'snip_1',
          'বিকাশ/নগদ পেমেন্ট রিসিভড মেসেজ',
          'প্রিয় {name}, আপনার {amount} টাকা পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে। ট্রানজেকশন আইডি: {trx_id}। সাথে থাকার জন্য ধন্যবাদ।',
          'cat_payment',
          'Payment (পেমেন্ট)',
          'bkash,nagad,payment,trx',
          now - 4000,

          'snip_2',
          'জরুরি ফাইবার লাইন মেইনটেন্যান্স অ্যালার্ট',
          'জরুরি বিজ্ঞপ্তি: {area} এলাকায় ফাইবার অপটিক ক্যাবল ক্ষতিগ্রস্ত হওয়ায় সাময়িক ইন্টারনেট সংযোগ বিঘ্নিত হতে পারে। আনুমানিক সমাধান সময়: {time}। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।',
          'cat_maintenance',
          'Maintenance Alert (রক্ষণাবেক্ষণ)',
          'fiber,maintenance,outage',
          now - 3000,

          'snip_3',
          'বিল বকেয়া পরিশোধের তাগাদা',
          'প্রিয় গ্রাহক {name}, চলতি মাসের ইন্টারনেট বিল {amount} টাকা পরিশোধের শেষ তারিখ {due_date}। সংযোগ বিচ্ছিন্নতা এড়াতে দ্রুত পরিশোধ করার অনুরোধ করা হলো।',
          'cat_billing',
          'Billing & Due (বিল বকেয়া)',
          'due,billing,warning',
          now - 2000,

          'snip_4',
          '🚨 হাই অপটিক্যাল লস টেকনিশিয়ান অ্যালার্ট',
          '🚨 টেকনিশিয়ান অ্যালার্ট: ONU ID: {onu_id}, পোর্ট: {port}, সিগন্যাল লস: {rx_power} dBm। গ্রাহক: {customer_name}। দ্রুত ড্রপ ফাইবার ও স্প্লাইস ট্রে চেক করুন।',
          'cat_support',
          'Support & Line Issue (সাপোর্ট)',
          'optical,loss,technician,olt',
          now - 1000,

          'snip_5',
          'নতুন সংযোগ সফলভাবে সক্রিয়করণ',
          'অভিনন্দন {name}! আপনার ব্রডব্যান্ড ইন্টারনেট সংযোগটি সফলভাবে এক্টিভ করা হয়েছে। ইউজারনেম: {username}, প্যাকেজ: {package}। হেল্পলাইন: {helpline}।',
          'cat_welcome',
          'New Customer (নতুন সংযোগ)',
          'welcome,activation,new',
          now,
        ],
      });
    }

    initialized = true;
  } catch (err: any) {
    console.warn('Database table auto-init notice:', err.message);
  }
}
