import { NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { reports, onus, signalLogs, fieldTickets } from '@/lib/db/schema';
import { parseMultiBrandOltOutput, ParsedOnu } from '@/lib/parsers/oltParser';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET: Fetch all reports or single report by id
export async function GET(request: Request) {
  try {
    await ensureTablesExist();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const found = await db.select().from(reports).where(eq(reports.id, id));
      if (found.length === 0) {
        return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
      }
      const item = found[0];
      return NextResponse.json({
        success: true,
        data: {
          ...item,
          items: JSON.parse(item.itemsJson || '[]'),
        },
      });
    }

    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt));
    const formatted = allReports.map((r) => ({
      id: r.id,
      title: r.title,
      sourceBrand: r.sourceBrand,
      threshold: r.threshold,
      totalOnus: r.totalOnus,
      criticalCount: r.criticalCount,
      warningCount: r.warningCount,
      optimalCount: r.optimalCount,
      worstRxPower: r.worstRxPower,
      createdAt: r.createdAt,
      items: JSON.parse(r.itemsJson || '[]'),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new report from raw OLT data
export async function POST(request: Request) {
  try {
    await ensureTablesExist();

    const body = await request.json();
    const { rawText, title, threshold = 24.0, brandHint = 'AUTO' } = body;

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ success: false, error: 'অনুগ্রহ করে OLT ডাটা পেস্ট করুন বা ফাইল দিন।' }, { status: 400 });
    }

    const cutoff = parseFloat(threshold) || 24.0;
    const parsedList: ParsedOnu[] = parseMultiBrandOltOutput(rawText, brandHint);

    if (parsedList.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'কোনো ONU রেকর্ড পাওয়া যায়নি! অনুগ্রহ করে আপনার OLT টার্মিনাল লগ বা টেবিল ফরম্যাটটি চেক করুন।',
        },
        { status: 400 }
      );
    }

    let criticalCount = 0;
    let warningCount = 0;
    let optimalCount = 0;
    let worstRx = 0;

    const reportItems = parsedList.map((item) => {
      const absRx = Math.abs(item.rxPower);
      let status = 'OPTIMAL';

      if (absRx >= cutoff) {
        status = 'CRITICAL';
        criticalCount++;
      } else if (absRx >= 21.0) {
        status = 'WARNING';
        warningCount++;
      } else {
        status = 'OPTIMAL';
        optimalCount++;
      }

      if (worstRx === 0 || item.rxPower < worstRx) {
        worstRx = item.rxPower;
      }

      return {
        ...item,
        status,
      };
    });

    const reportId = `rep_${Date.now()}`;
    const now = new Date();

    const formattedDate = now.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const reportTitle =
      title && title.trim()
        ? title.trim()
        : `OLT Report - ${formattedDate}, ${formattedTime}`;

    const newReport = {
      id: reportId,
      title: reportTitle,
      sourceBrand: brandHint !== 'AUTO' ? brandHint : (reportItems[0]?.brandDetected || 'Auto Detected'),
      threshold: cutoff,
      totalOnus: reportItems.length,
      criticalCount,
      warningCount,
      optimalCount,
      worstRxPower: worstRx,
      itemsJson: JSON.stringify(reportItems),
      createdAt: now,
    };

    await db.insert(reports).values(newReport);

    return NextResponse.json({
      success: true,
      message: 'রিপোর্ট সফলভাবে তৈরি হয়েছে!',
      data: {
        ...newReport,
        items: reportItems,
      },
    });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete single report or all reports & data
export async function DELETE(request: Request) {
  try {
    await ensureTablesExist();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      // Clear all reports and legacy data completely
      await db.delete(reports);
      await db.delete(onus);
      await db.delete(signalLogs);
      await db.delete(fieldTickets);

      return NextResponse.json({
        success: true,
        message: 'সব ডাটা এবং রিপোর্ট সফলভাবে একবারে ডিলিট করা হয়েছে!',
      });
    }

    if (id) {
      await db.delete(reports).where(eq(reports.id, id));
      return NextResponse.json({
        success: true,
        message: 'রিপোর্টটি ডিলিট করা হয়েছে।',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Provide id or all=true to delete.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
