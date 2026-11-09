import { NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { snippets, categories } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET: Fetch snippets and categories
export async function GET(request: Request) {
  try {
    await ensureTablesExist();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const category = searchParams.get('category') || '';

    // Fetch categories
    const allCategories = await db.select().from(categories);

    // Fetch snippets
    let allSnippets = await db
      .select()
      .from(snippets)
      .orderBy(desc(snippets.isPinned), desc(snippets.copyCount), desc(snippets.createdAt));

    // Filter in-memory for flexible multi-field search
    if (category && category !== 'ALL') {
      allSnippets = allSnippets.filter(
        (s) => s.categoryId === category || s.categoryName === category
      );
    }

    if (search.trim()) {
      const q = search.trim();
      allSnippets = allSnippets.filter((s) => {
        const text = `${s.title} ${s.content} ${s.contentBangla || ''} ${s.contentBanglish || ''} ${s.contentEnglish || ''} ${s.tags || ''} ${s.categoryName || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    return NextResponse.json({
      success: true,
      snippets: allSnippets,
      categories: allCategories,
    });
  } catch (error: any) {
    console.error('Error fetching snippets:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new snippet or category
export async function POST(request: Request) {
  try {
    await ensureTablesExist();

    const body = await request.json();
    const {
      action,
      title,
      content,
      contentBangla,
      contentBanglish,
      contentEnglish,
      categoryId,
      categoryName,
      tags,
      isPinned,
      name,
      slug,
    } = body;

    // Handle bulk snippet creation
    if (action === 'bulk_create' || Array.isArray(body.items)) {
      const bulkItems = Array.isArray(body.items) ? body.items : (Array.isArray(body) ? body : []);
      const overwriteExisting = Boolean(body.overwriteExisting ?? true);

      let insertedCount = 0;
      let updatedCount = 0;

      for (let i = 0; i < bulkItems.length; i++) {
        const item = bulkItems[i];
        const t = (item.title || '').trim();
        const bn = (item.contentBangla || item.content || '').trim();
        const bng = (item.contentBanglish || '').trim();
        const en = (item.contentEnglish || '').trim();
        const cat = (item.categoryName || 'General').trim();
        const tg = (item.tags || '').trim();
        const main = bn || bng || en;

        if (!t || !main) continue;

        const existing = await db.select().from(snippets).where(eq(snippets.title, t));
        if (existing.length > 0) {
          if (overwriteExisting) {
            await db
              .update(snippets)
              .set({
                title: t,
                content: main,
                contentBangla: bn || main,
                contentBanglish: bng,
                contentEnglish: en,
                categoryName: cat,
                tags: tg,
              })
              .where(eq(snippets.id, existing[0].id));
            updatedCount++;
          }
        } else {
          await db.insert(snippets).values({
            id: item.id || `snip_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            title: t,
            content: main,
            contentBangla: bn || main,
            contentBanglish: bng,
            contentEnglish: en,
            categoryName: cat,
            tags: tg,
            isPinned: Boolean(item.isPinned),
            copyCount: 0,
            createdAt: new Date(),
          });
          insertedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `বাল্ক ইমপোর্ট সম্পন্ন! নতুন: ${insertedCount} টি, আপডেট: ${updatedCount} টি`,
        insertedCount,
        updatedCount,
      });
    }

    // Handle new category creation
    if (action === 'create_category') {
      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
      }
      const catSlug = slug || name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
      const catId = `cat_${Date.now()}`;
      await db.insert(categories).values({
        id: catId,
        name: name.trim(),
        slug: catSlug,
      });
      return NextResponse.json({
        success: true,
        message: 'ক্যাটাগরি সফলভাবে তৈরি হয়েছে!',
        category: { id: catId, name: name.trim(), slug: catSlug },
      });
    }

    // Handle snippet creation
    const mainContent = contentBangla || contentBanglish || contentEnglish || content;
    if (!title || !title.trim() || !mainContent || !mainContent.trim()) {
      return NextResponse.json(
        { success: false, error: 'মেসেজের শিরোনাম (Title) এবং অন্তত একটি ভাষার টেক্সট পূরণ করুন।' },
        { status: 400 }
      );
    }

    const snippetId = `snip_${Date.now()}`;
    const newSnippet = {
      id: snippetId,
      title: title.trim(),
      content: mainContent.trim(),
      contentBangla: contentBangla ? contentBangla.trim() : (content || ''),
      contentBanglish: contentBanglish ? contentBanglish.trim() : '',
      contentEnglish: contentEnglish ? contentEnglish.trim() : '',
      categoryId: categoryId || 'cat_payment',
      categoryName: categoryName || 'General',
      tags: tags ? tags.trim() : '',
      isPinned: Boolean(isPinned),
      copyCount: 0,
      createdAt: new Date(),
    };

    await db.insert(snippets).values(newSnippet);

    return NextResponse.json({
      success: true,
      message: 'মেসেজ টেমপ্লেট সফলভাবে যোগ হয়েছে!',
      data: newSnippet,
    });
  } catch (error: any) {
    console.error('Error creating snippet:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update snippet, increment copy count, or toggle pin
export async function PUT(request: Request) {
  try {
    await ensureTablesExist();

    const body = await request.json();
    const {
      id,
      action,
      title,
      content,
      contentBangla,
      contentBanglish,
      contentEnglish,
      categoryId,
      categoryName,
      tags,
      isPinned,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Snippet ID is required' }, { status: 400 });
    }

    // Action: Increment copy count
    if (action === 'increment_copy') {
      await db
        .update(snippets)
        .set({
          copyCount: sql`${snippets.copyCount} + 1`,
        })
        .where(eq(snippets.id, id));

      return NextResponse.json({ success: true, message: 'Copy count updated' });
    }

    // Action: Toggle Pin
    if (action === 'toggle_pin') {
      const existing = await db.select().from(snippets).where(eq(snippets.id, id));
      if (existing.length === 0) {
        return NextResponse.json({ success: false, error: 'Snippet not found' }, { status: 404 });
      }
      const newPinState = !existing[0].isPinned;
      await db
        .update(snippets)
        .set({ isPinned: newPinState })
        .where(eq(snippets.id, id));

      return NextResponse.json({ success: true, isPinned: newPinState });
    }

    const mainContent = contentBangla || contentBanglish || contentEnglish || content;

    // General update
    await db
      .update(snippets)
      .set({
        title: title?.trim(),
        content: mainContent?.trim(),
        contentBangla: contentBangla?.trim(),
        contentBanglish: contentBanglish?.trim(),
        contentEnglish: contentEnglish?.trim(),
        categoryId,
        categoryName,
        tags: tags?.trim(),
        isPinned: Boolean(isPinned),
      })
      .where(eq(snippets.id, id));

    return NextResponse.json({ success: true, message: 'মেসেজ সফলভাবে আপডেট করা হয়েছে!' });
  } catch (error: any) {
    console.error('Error updating snippet:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete snippet
export async function DELETE(request: Request) {
  try {
    await ensureTablesExist();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Snippet ID is required' }, { status: 400 });
    }

    await db.delete(snippets).where(eq(snippets.id, id));
    return NextResponse.json({ success: true, message: 'মেসেজটি ডিলিট করা হয়েছে।' });
  } catch (error: any) {
    console.error('Error deleting snippet:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
