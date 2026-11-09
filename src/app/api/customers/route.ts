import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers, onus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db.select().from(customers);
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(customers).values({
      id,
      name: body.name || 'Unnamed Customer',
      pppoeUsername: body.pppoeUsername || '',
      phone: body.phone || '',
      address: body.address || '',
      zone: body.zone || 'General',
      package: body.package || 'Standard',
      status: body.status || 'ACTIVE',
      onuId: body.onuId || '',
      mac: body.mac || '',
      notes: body.notes || '',
      createdAt: new Date(),
    });

    // If ONU ID or MAC matches an existing ONU, link it!
    if (body.onuId) {
      await db
        .update(onus)
        .set({ customerId: id })
        .where(eq(onus.onuId, body.onuId));
    }

    return NextResponse.json({ success: true, message: 'Customer added successfully', id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
