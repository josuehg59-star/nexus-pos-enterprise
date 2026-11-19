// Utilidad universal para el manejo y parseo de fechas en NEXUS POS ENTERPRISE

export function parseUniversalTimestamp(fechaVal: any): number {
  if (!fechaVal) return 0;
  if (typeof fechaVal === 'number') return fechaVal;

  const str = String(fechaVal).replace(/[\u202f\u00a0]/g, ' ').trim();
  if (!str) return 0;

  // 1. Prioridad: Formato Latino DD/MM/YYYY o D/M/YYYY (es-MX)
  // Ejemplos: "11/10/2026, 09:14:53", "12/10/2026 14:30:00", "05/10/2026"
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed (0=Enero, 9=Octubre)
    const year = parseInt(dmyMatch[3], 10);

    const timeMatch = str.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    let hour = 12, min = 0, sec = 0;
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      min = parseInt(timeMatch[2], 10);
      sec = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    }

    const lower = str.toLowerCase();
    const isPM = lower.includes('p.') || lower.includes('pm') || lower.includes('p.m.');
    const isAM = lower.includes('a.') || lower.includes('am') || lower.includes('a.m.');
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    const parsed = new Date(year, month, day, hour, min, sec).getTime();
    if (!isNaN(parsed)) return parsed;
  }

  // 2. Formato ISO estándar: "2026-10-12T13:17:10.942Z" o "2026-10-12"
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const directIso = new Date(str).getTime();
    if (!isNaN(directIso)) return directIso;

    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day, 12, 0, 0).getTime();
  }

  // 3. Fallback de Date.parse únicamente si no coincide con formatos específicos
  const direct = Date.parse(str);
  if (!isNaN(direct)) return direct;

  return 0;
}

/**
 * Obtiene el rango de timestamps (startTs = 00:00:00.000, endTs = 23:59:59.999) para una fecha local.
 * dateStr: 'YYYY-MM-DD' o Date
 */
export function getDayRange(dateInput?: Date | string): { startTs: number; endTs: number; dateStr: string } {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string') {
    // Si viene como YYYY-MM-DD
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = new Date(dateInput);
  }

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  const start = new Date(year, month, day, 0, 0, 0, 0);
  const end = new Date(year, month, day, 23, 59, 59, 999);

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;

  return {
    startTs: start.getTime(),
    endTs: end.getTime(),
    dateStr
  };
}

export function formatLocalDateStr(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
