import { NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { onus, reports, signalLogs, fieldTickets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureTablesExist();
    const allOnus = await db
      .select({
        id: onus.id,
        onuId: onus.onuId,
        port: onus.port,
        mac: onus.mac,
        description: onus.description,
        distance: onus.distance,
        rxPower: onus.rxPower,
        txPower: onus.txPower,
        temp: onus.temp,
        voltage: onus.voltage,
        txBias: onus.txBias,
        status: onus.status,
        updatedAt: onus.updatedAt,
      })
      .from(onus);

    return NextResponse.json({ success: true, data: allOnus });
  } catch (error: any) {
    console.error('Error fetching ONUs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureTablesExist();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const onuId = searchParams.get('onuId');
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      await db.delete(reports);
      await db.delete(onus);
      await db.delete(signalLogs);
      await db.delete(fieldTickets);
      return NextResponse.json({ success: true, message: 'All OLT data and reports deleted successfully.' });
    }

    if (id) {
      await db.delete(onus).where(eq(onus.id, id));
      return NextResponse.json({ success: true, message: `ONU deleted successfully.` });
    }

    if (onuId) {
      await db.delete(onus).where(eq(onus.onuId, onuId));
      return NextResponse.json({ success: true, message: `ONU ${onuId} deleted successfully.` });
    }

    return NextResponse.json({ success: false, error: 'Provide an id, onuId, or all=true to delete.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting ONU:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
