import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { onus, signalLogs, customers, fieldTickets } from '@/lib/db/schema';
import { parseMultiBrandOltOutput } from '@/lib/parsers/oltParser';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { rawText, brandHint = 'AUTO', threshold = 24.0, clearPrevious = false, autoCreateTickets = false } = await request.json();

    if (!rawText) {
      return NextResponse.json({ success: false, error: 'No OLT text provided' }, { status: 400 });
    }

    const parsedOnus = parseMultiBrandOltOutput(rawText, brandHint);

    if (parsedOnus.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No ONU diagnostic records found. Please check your OLT output format.',
      }, { status: 400 });
    }

    // Option to clear old data before importing new log
    if (clearPrevious) {
      await db.delete(onus);
      await db.delete(signalLogs);
      await db.delete(fieldTickets);
    }

    const allCustomers = await db.select().from(customers);
    const customerMap = new Map<string, string>();
    allCustomers.forEach((c) => {
      if (c.onuId) customerMap.set(c.onuId.toLowerCase(), c.id);
      if (c.mac) customerMap.set(c.mac.toLowerCase(), c.id);
    });

    let highLossCount = 0;
    let warningCount = 0;
    let optimalCount = 0;

    for (const item of parsedOnus) {
      const absRx = Math.abs(item.rxPower);
      let status = 'OPTIMAL';
      if (absRx >= threshold) {
        status = 'CRITICAL';
        highLossCount++;
      } else if (absRx >= 21.0) {
        status = 'WARNING';
        warningCount++;
      } else {
        optimalCount++;
      }

      const existingCustomerId =
        customerMap.get(item.onuId.toLowerCase()) ||
        (item.mac ? customerMap.get(item.mac.toLowerCase()) : null);

      const id = `onu_${item.onuId.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Check if already in DB
      const existing = await db.select().from(onus).where(eq(onus.onuId, item.onuId));

      if (existing.length > 0) {
        await db
          .update(onus)
          .set({
            port: item.port,
            mac: item.mac || existing[0].mac,
            description: item.description || existing[0].description,
            distance: item.distance || existing[0].distance,
            rxPower: item.rxPower,
            txPower: item.txPower || existing[0].txPower,
            temp: item.temp || existing[0].temp,
            voltage: item.voltage || existing[0].voltage,
            txBias: item.txBias || existing[0].txBias,
            status,
            customerId: existingCustomerId || existing[0].customerId,
            updatedAt: new Date(),
          })
          .where(eq(onus.onuId, item.onuId));
      } else {
        await db.insert(onus).values({
          id,
          onuId: item.onuId,
          port: item.port,
          mac: item.mac,
          description: item.description || '',
          distance: item.distance || '',
          rxPower: item.rxPower,
          txPower: item.txPower || '',
          temp: item.temp || '',
          voltage: item.voltage || '',
          txBias: item.txBias || '',
          status,
          customerId: existingCustomerId || null,
          updatedAt: new Date(),
        });
      }

      // Record signal log for history tracking
      await db.insert(signalLogs).values({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        onuId: item.onuId,
        mac: item.mac,
        rxPower: item.rxPower,
        txPower: item.txPower || '',
        recordedAt: new Date(),
      });

      // Optional Auto-ticket for Critical High dB
      if (autoCreateTickets && status === 'CRITICAL') {
        const ticketId = `tkt_${item.onuId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        await db.insert(fieldTickets).values({
          id: ticketId,
          ticketNumber: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
          onuId: item.onuId,
          port: item.port,
          mac: item.mac,
          rxPower: item.rxPower,
          status: 'OPEN',
          priority: 'CRITICAL',
          assignedTo: 'Fiber Maintenance Team',
          issueNote: `Auto Alert: High optical attenuation ${item.rxPower} dBm (> ${threshold} dB)`,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Parsed & Synced ${parsedOnus.length} ONUs successfully.`,
      metrics: {
        total: parsedOnus.length,
        critical: highLossCount,
        warning: warningCount,
        optimal: optimalCount,
      },
    });
  } catch (error: any) {
    console.error('Error during OLT sync:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
