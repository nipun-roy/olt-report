import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fieldTickets } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db.select().from(fieldTickets).orderBy(desc(fieldTickets.createdAt));
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = `tkt_${Date.now()}`;
    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    await db.insert(fieldTickets).values({
      id,
      ticketNumber,
      onuId: body.onuId,
      port: body.port || '',
      mac: body.mac || '',
      rxPower: body.rxPower,
      customerName: body.customerName || '',
      phone: body.phone || '',
      status: body.status || 'OPEN',
      priority: body.priority || 'CRITICAL',
      assignedTo: body.assignedTo || 'Unassigned',
      issueNote: body.issueNote || `High Optical Loss detected (${body.rxPower} dBm)`,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Ticket created', ticketNumber });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, resolutionNote, assignedTo } = body;

    const updates: any = {};
    if (status) {
      updates.status = status;
      if (status === 'RESOLVED') {
        updates.resolvedAt = new Date();
      }
    }
    if (resolutionNote !== undefined) updates.resolutionNote = resolutionNote;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;

    await db.update(fieldTickets).set(updates).where(eq(fieldTickets.id, id));

    return NextResponse.json({ success: true, message: 'Ticket updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
