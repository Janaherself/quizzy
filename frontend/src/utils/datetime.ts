export const AMMAN_TZ = 'Asia/Amman';

function parseOffsetToMinutes(value: string): number {
  const m = value.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const hours = parseInt(m[2], 10);
  const mins = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (hours * 60 + mins);
}

function ammanOffsetAt(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: AMMAN_TZ,
    hourCycle: 'h23',
    timeZoneName: 'shortOffset',
  }).formatToParts(date);
  const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? '+00:00';
  return parseOffsetToMinutes(tzName);
}

export function fromAmmanDateTimeLocal(value: string): string {
  const [datePart, timePart] = value.split('T');
  const [Y, M, D] = datePart.split('-').map(Number);
  const [h, m] = (timePart || '00:00').split(':').map(Number);
  const trial = new Date(Date.UTC(Y, M - 1, D, h, m));
  const offsetMin = ammanOffsetAt(trial);
  const utcMs = Date.UTC(Y, M - 1, D, h, m) - offsetMin * 60000;
  return new Date(utcMs).toISOString();
}

export function toAmmanDateTimeLocal(utcIso: string): string {
  const d = new Date(utcIso);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: AMMAN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

export function formatDateTime(utcIso: string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: AMMAN_TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(utcIso));
}

export function formatDate(utcIso: string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: AMMAN_TZ,
    dateStyle: 'medium',
  }).format(new Date(utcIso));
}
