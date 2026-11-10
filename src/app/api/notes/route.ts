import { NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { workNotes } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireApiAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET: Fetch notes and summary counts
export async function GET(request: Request) {
  try {
    await ensureTablesExist();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'ALL';
    const priorityFilter = searchParams.get('priority') || 'ALL';
    const categoryFilter = searchParams.get('category') || 'ALL';
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const sortBy = searchParams.get('sortBy') || 'urgency'; // 'urgency' | 'newest' | 'oldest'

    // Fetch all notes
    const allNotes = await db
      .select()
      .from(workNotes)
      .orderBy(desc(workNotes.createdAt));

    // Calculate live counts
    const counts = {
      total: allNotes.length,
      pending: allNotes.filter((n) => n.status === 'PENDING').length,
      inProgress: allNotes.filter((n) => n.status === 'IN_PROGRESS').length,
      completed: allNotes.filter((n) => n.status === 'COMPLETED').length,
      criticalPending: allNotes.filter(
        (n) => n.status === 'PENDING' && n.priority === 'CRITICAL'
      ).length,
    };

    // Filter by status
    let filtered = allNotes;
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((n) => n.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter((n) => n.priority === priorityFilter);
    }

    // Filter by category
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter((n) => n.category === categoryFilter);
    }

    // Search query match
    if (search) {
      filtered = filtered.filter((n) => {
        const text = `${n.title} ${n.description || ''} ${n.targetId || ''} ${n.assignedTo || ''} ${n.resolutionNote || ''} ${n.createdBy || ''}`.toLowerCase();
        return text.includes(search);
      });
    }

    // Sorting
    if (sortBy === 'urgency') {
      // Pending first (Critical -> High -> Medium -> Low, sorted by oldest first to resolve oldest first)
      const priorityWeight: Record<string, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };
      filtered.sort((a, b) => {
        // Pending and In Progress come first
        const aActive = a.status !== 'COMPLETED' ? 1 : 0;
        const bActive = b.status !== 'COMPLETED' ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;

        // Then higher priority
        const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
        if (pDiff !== 0) return pDiff;

        // Then oldest first (longest waiting task first)
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    return NextResponse.json({
      success: true,
      notes: filtered,
      counts,
    });
  } catch (error: any) {
    console.error('Error fetching work notes:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new work note
export async function POST(request: Request) {
  try {
    await ensureTablesExist();

    const authCheck = await requireApiAuth(request);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const body = await request.json();
    const { title, description, category, priority, targetId, assignedTo } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'নোটের শিরোনাম (Title) দেওয়া আবশ্যক।' },
        { status: 400 }
      );
    }

    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const newNote = {
      id,
      title: title.trim(),
      description: description ? description.trim() : null,
      category: category || 'GENERAL',
      priority: priority || 'HIGH',
      status: 'PENDING' as const,
      targetId: targetId ? targetId.trim() : null,
      assignedTo: assignedTo ? assignedTo.trim() : null,
      createdBy: authCheck.user.name || authCheck.user.email || 'NOC Operator',
      resolutionNote: null,
      createdAt: now,
      startedAt: null,
      completedAt: null,
      updatedAt: now,
    };

    await db.insert(workNotes).values(newNote);

    return NextResponse.json({
      success: true,
      message: 'নতুন কাজের নোট সফলভাবে যুক্ত করা হয়েছে!',
      note: newNote,
    });
  } catch (error: any) {
    console.error('Error creating work note:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update work note status, assignment, resolution note, etc.
export async function PATCH(request: Request) {
  try {
    await ensureTablesExist();

    const authCheck = await requireApiAuth(request);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const body = await request.json();
    const { id, status, resolutionNote, assignedTo, priority, category, title, description } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Note ID প্রয়োজন।' },
        { status: 400 }
      );
    }

    // Find existing note
    const existing = await db
      .select()
      .from(workNotes)
      .where(eq(workNotes.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'নোটটি পাওয়া যায়নি।' },
        { status: 404 }
      );
    }

    const note = existing[0];
    const now = new Date();
    const updateData: any = {
      updatedAt: now,
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo ? assignedTo.trim() : null;

    // Status transition logic
    if (status !== undefined) {
      updateData.status = status;

      if (status === 'IN_PROGRESS') {
        if (!note.startedAt) {
          updateData.startedAt = now;
        }
      } else if (status === 'COMPLETED') {
        updateData.completedAt = now;
        if (resolutionNote !== undefined) {
          updateData.resolutionNote = resolutionNote ? resolutionNote.trim() : null;
        }
      } else if (status === 'PENDING') {
        // Re-open
        updateData.completedAt = null;
      }
    }

    if (resolutionNote !== undefined && status !== 'COMPLETED') {
      updateData.resolutionNote = resolutionNote ? resolutionNote.trim() : null;
    }

    await db.update(workNotes).set(updateData).where(eq(workNotes.id, id));

    const updated = await db
      .select()
      .from(workNotes)
      .where(eq(workNotes.id, id))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'নোট আপডেট সম্পন্ন হয়েছে!',
      note: updated[0],
    });
  } catch (error: any) {
    console.error('Error updating work note:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove a note
export async function DELETE(request: Request) {
  try {
    await ensureTablesExist();

    const authCheck = await requireApiAuth(request);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Note ID প্রয়োজন।' },
        { status: 400 }
      );
    }

    await db.delete(workNotes).where(eq(workNotes.id, id));

    return NextResponse.json({
      success: true,
      message: 'নোটটি সফলভাবে মুছে ফেলা হয়েছে!',
    });
  } catch (error: any) {
    console.error('Error deleting work note:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
