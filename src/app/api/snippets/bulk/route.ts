import { NextResponse } from 'next/server';
import { db, client, ensureTablesExist } from '@/lib/db';
import { snippets, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireApiAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await ensureTablesExist();

    // Security Check: Bulk import requires valid session
    const authCheck = await requireApiAuth(request);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const body = await request.json();
    const items = Array.isArray(body) ? body : (body.items || body.templates || []);
    const overwriteExisting = Boolean(body.overwriteExisting ?? true);

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'কোনো টেমপ্লেট পাওয়া যায়নি। অন্তত একটি টেমপ্লেট পাঠান।' },
        { status: 400 }
      );
    }

    // Pre-fetch existing categories and snippets
    const existingCategories = await db.select().from(categories);
    const existingCategoryMap = new Map(existingCategories.map((c) => [c.name.toLowerCase().trim(), c]));

    const existingSnippets = await db.select().from(snippets);
    const existingSnippetMap = new Map(existingSnippets.map((s) => [s.title.toLowerCase().trim(), s]));
    const existingIdMap = new Map(existingSnippets.map((s) => [s.id, s]));

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = (item.title || item.Title || '').trim();
      const bn = (item.contentBangla || item.Bangla || item.bangla || item.content || '').trim();
      const bng = (item.contentBanglish || item.Banglish || item.banglish || '').trim();
      const en = (item.contentEnglish || item.English || item.english || '').trim();
      const catName = (item.categoryName || item.Category || item.category || 'General').trim();
      const tags = (item.tags || item.Tags || '').trim();
      const isPinned = Boolean(item.isPinned || item.pinned || false);

      const mainText = bn || bng || en;
      if (!title || !mainText) {
        skippedCount++;
        continue;
      }

      // Auto-resolve or create category
      let catId = item.categoryId;
      if (!catId) {
        const catKey = catName.toLowerCase();
        if (existingCategoryMap.has(catKey)) {
          catId = existingCategoryMap.get(catKey)!.id;
        } else {
          // Create new category on the fly
          const newCatSlug = catKey.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
          catId = `cat_${Date.now()}_${i}`;
          try {
            await db.insert(categories).values({
              id: catId,
              name: catName,
              slug: newCatSlug || `cat-${Date.now()}-${i}`,
            });
            existingCategoryMap.set(catKey, { id: catId, name: catName, slug: newCatSlug });
          } catch (catErr) {
            console.warn('Category insert notice:', catErr);
          }
        }
      }

      const titleKey = title.toLowerCase();
      const existingMatch = (item.id && existingIdMap.get(item.id)) || existingSnippetMap.get(titleKey);

      if (existingMatch) {
        if (overwriteExisting) {
          // Update existing snippet
          await db
            .update(snippets)
            .set({
              title,
              content: mainText,
              contentBangla: bn || mainText,
              contentBanglish: bng,
              contentEnglish: en,
              categoryId: catId,
              categoryName: catName,
              tags: tags || existingMatch.tags || '',
              isPinned: isPinned !== undefined ? isPinned : existingMatch.isPinned,
            })
            .where(eq(snippets.id, existingMatch.id));
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        // Insert new snippet
        const newId = item.id?.trim() || `snip_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
        await db.insert(snippets).values({
          id: newId,
          title,
          content: mainText,
          contentBangla: bn || mainText,
          contentBanglish: bng,
          contentEnglish: en,
          categoryId: catId,
          categoryName: catName,
          tags,
          isPinned,
          copyCount: 0,
          createdAt: new Date(),
        });
        insertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `বাল্ক ইমপোর্ট সফল হয়েছে! নতুন যোগ: ${insertedCount} টি, আপডেট: ${updatedCount} টি${
        skippedCount > 0 ? `, বাদ পড়েছে: ${skippedCount} টি` : ''
      }`,
      insertedCount,
      updatedCount,
      skippedCount,
      totalProcessed: items.length,
    });
  } catch (error: any) {
    console.error('Error in bulk snippet import:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
