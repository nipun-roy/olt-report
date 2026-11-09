import { db } from './index';
import { onus, customers, fieldTickets } from './schema';
import * as fs from 'fs';
import * as path from 'path';

async function seed() {
  console.log('Seeding initial OLT data from demo.txt...');

  const demoPath = path.resolve(__dirname, '../../../../demo.txt');
  if (!fs.existsSync(demoPath)) {
    console.error('demo.txt not found at', demoPath);
    return;
  }

  const content = fs.readFileSync(demoPath, 'utf8');
  const lines = content.split(/\r?\n/);

  let highLossCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split('\t');
    if (cols.length >= 8) {
      const onuId = cols[0].trim();
      const port = onuId.split(':')[0];
      const mac = cols[1].trim();
      const distance = cols[3].trim();
      const temp = cols[4].trim();
      const voltage = cols[5].trim();
      const txBias = cols[6].trim();
      const txPower = cols[7].trim();
      const rxVal = parseFloat(cols[8] || cols[7]);

      if (isNaN(rxVal)) continue;

      const absRx = Math.abs(rxVal);
      const isCritical = absRx >= 24.0;
      const isWarning = absRx >= 21.0 && absRx < 24.0;
      const status = isCritical ? 'CRITICAL' : (isWarning ? 'WARNING' : 'OPTIMAL');

      if (isCritical) highLossCount++;

      const id = `onu_${onuId.replace(/[^a-zA-Z0-9]/g, '_')}`;

      await db.insert(onus).values({
        id,
        onuId,
        port,
        mac,
        distance,
        temp,
        voltage,
        txBias,
        txPower,
        rxPower: rxVal,
        status,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: onus.id,
        set: {
          rxPower: rxVal,
          status,
          updatedAt: new Date(),
        }
      });

      // Auto-create ticket for critical loss
      if (isCritical) {
        await db.insert(fieldTickets).values({
          id: `tkt_${id}`,
          ticketNumber: `TKT-${1000 + highLossCount}`,
          onuId,
          port,
          mac,
          rxPower: rxVal,
          status: 'OPEN',
          priority: 'CRITICAL',
          assignedTo: 'Fiber Maintenance Team',
          issueNote: `Optical attenuation is ${rxVal} dBm (> 24 dB loss). Inspect splitter & splice box.`,
          createdAt: new Date(),
        }).onConflictDoNothing();
      }
    }
  }

  console.log(`✅ Seeded ${lines.length - 1} ONUs successfully! (${highLossCount} High dB >24dB)`);
}

seed().catch(console.error);
