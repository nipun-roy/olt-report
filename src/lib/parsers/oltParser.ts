export interface ParsedOnu {
  onuId: string;
  port: string;
  mac: string;
  description?: string;
  distance?: string;
  rxPower: number; // e.g. -29.21
  txPower?: string;
  temp?: string;
  voltage?: string;
  txBias?: string;
  brandDetected?: string;
}

export function parseMultiBrandOltOutput(rawText: string, brandHint: string = 'AUTO'): ParsedOnu[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const results: ParsedOnu[] = [];
  const seenOnus = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line || line.startsWith('===') || line.startsWith('---') || line.startsWith('###')) continue;

    // Skip Header line if contains header words
    const lower = line.toLowerCase();
    if (
      (lower.includes('onu id') || lower.includes('mac address') || lower.includes('ont id') || lower.includes('port/onu')) &&
      (lower.includes('rx') || lower.includes('power') || lower.includes('signal') || lower.includes('dbm'))
    ) {
      continue;
    }

    // 1. CSV Format check: comma-separated
    if (line.includes(',') && !line.startsWith('#')) {
      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 3) {
        const onuId = parts[0];
        if (onuId.includes(':') || onuId.includes('/') || onuId.toLowerCase().includes('pon')) {
          const rxPart = parts.find((p) => /^-?\d+(\.\d+)?$/.test(p) && parseFloat(p) < 0 && parseFloat(p) > -50);
          if (rxPart) {
            const rxVal = parseFloat(rxPart);
            const macPart = parts.find((p) => /([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/.test(p) || /([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4})/.test(p)) || '';
            const port = onuId.includes(':') ? onuId.split(':')[0] : onuId;

            if (!seenOnus.has(onuId)) {
              seenOnus.add(onuId);
              results.push({
                onuId,
                port,
                mac: macPart,
                rxPower: rxVal,
                txPower: parts[3] && !isNaN(parseFloat(parts[3])) ? parts[3] : '',
                distance: parts[4] || '',
                brandDetected: 'CSV / Exported Table',
              });
              continue;
            }
          }
        }
      }
    }

    // 2. Check for standard tab or multiple-space delimited BDCOM / CDATA / VSOL format
    const delimiter = rawLine.includes('\t') ? /\t+/ : /\s{2,}/;
    const tabCols = rawLine.trim().split(delimiter);
    if (tabCols.length >= 4 && (tabCols[0].includes(':') || tabCols[0].includes('/'))) {
      const onuId = tabCols[0].trim();
      const port = onuId.includes(':') ? onuId.split(':')[0] : onuId;
      
      // Find RX Power in columns (typically a negative number between -6 and -45)
      let rxVal: number | null = null;
      let rxIndex = -1;

      for (let c = tabCols.length - 1; c >= 1; c--) {
        const val = parseFloat(tabCols[c].replace(/[^\d.-]/g, ''));
        if (!isNaN(val) && val <= -6.0 && val >= -48.0) {
          rxVal = val;
          rxIndex = c;
          break;
        }
      }

      if (rxVal !== null) {
        const mac = tabCols[1] && (tabCols[1].includes(':') || tabCols[1].includes('.') || tabCols[1].includes('-')) ? tabCols[1].trim() : '';
        const txPower = rxIndex > 1 && parseFloat(tabCols[rxIndex - 1]) > 0 && parseFloat(tabCols[rxIndex - 1]) < 10 ? tabCols[rxIndex - 1].trim() : '';

        if (!seenOnus.has(onuId)) {
          seenOnus.add(onuId);
          results.push({
            onuId,
            port,
            mac,
            description: tabCols[2] && tabCols.length > 5 ? tabCols[2].trim() : '',
            distance: tabCols[3] && /^\d+$/.test(tabCols[3].trim()) ? tabCols[3].trim() : '',
            txPower,
            rxPower: rxVal,
            brandDetected: 'BDCOM / VSOL / CDATA Table',
          });
          continue;
        }
      }
    }

    // 3. Check Huawei GPON format:
    // e.g. "0/1/1  1  -27.45  2.15  45  1500m" OR "ONT-ID: 1, Rx optical power(dBm): -25.21"
    if (lower.includes('rx') && (lower.includes('optical power') || lower.includes('power(dbm)') || lower.includes('power:'))) {
      const rxMatch = line.match(/(-?\d+\.\d+|-?\d+)\s*(dBm)?/i);
      const idMatch = line.match(/(ONT-ID|ONU-ID|ID)\s*[:=]?\s*(\d+)/i) || line.match(/(\d+\/\d+\/\d+:\d+)/i);
      if (rxMatch && idMatch) {
        let rx = parseFloat(rxMatch[1]);
        if (rx > 0) rx = -rx; // Make sure RX is negative loss
        const onuId = idMatch[0];
        const port = onuId.includes(':') ? onuId.split(':')[0] : 'GPON';

        if (!seenOnus.has(onuId)) {
          seenOnus.add(onuId);
          results.push({
            onuId,
            port,
            mac: '',
            rxPower: rx,
            brandDetected: 'Huawei GPON',
          });
          continue;
        }
      }
    }

    // 4. Generic Matcher for any OLT CLI output:
    // Look for ONU ID format: "EPON0/1:12" or "GPON0/1:5" or "1/1/1:2" or "gpon-onu_1/1/1:1"
    const onuRegex = /((EPON|GPON|pon)[\w\/\.:-]+|\b\d+\/\d+\/\d+:\d+|\b\d+\/\d+:\d+)/i;
    const onuMatch = line.match(onuRegex);

    // Look for MAC Address (00:11:22:33:44:55 or 0011.2233.4455 or 00-11-22-33-44-55)
    const macMatch =
      line.match(/([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/) ||
      line.match(/([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4})/);

    // Look for numbers representing RX power (usually between -6.00 and -45.00 dBm)
    const rxMatches = line.match(/(-[0-4]?\d\.\d+|-40\.00|-30|-2\d(\.\d+)?)/g);

    if (onuMatch && rxMatches && rxMatches.length > 0) {
      const onuId = onuMatch[1];
      const port = onuId.includes(':')
        ? onuId.split(':')[0]
        : (onuId.includes('/') ? onuId.substring(0, onuId.lastIndexOf(':')) : 'PORT');
      
      const rxVal = parseFloat(rxMatches[rxMatches.length - 1]); // Last negative decimal is typically RX Power

      // Find possible distances (numbers with 'm' or 3-5 digits)
      const distMatch = line.match(/\b(\d{3,5})\s*m?\b/);
      const txMatch = line.match(/\b([0-5]\.\d{2})\b/);

      if (!seenOnus.has(onuId)) {
        seenOnus.add(onuId);
        results.push({
          onuId,
          port,
          mac: macMatch ? macMatch[0] : '',
          rxPower: rxVal,
          distance: distMatch ? distMatch[1] : '',
          txPower: txMatch ? txMatch[1] : '',
          brandDetected: brandHint !== 'AUTO' ? brandHint : 'Auto Detected',
        });
      }
    }
  }

  return results;
}
