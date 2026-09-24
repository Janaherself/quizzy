export type QuizStatus = 'Draft' | 'Upcoming' | 'Live' | 'Closed' | 'Completed' | 'InProgress';

export const statusLabel: Record<string, string> = {
  Draft: 'مسودة',
  Upcoming: 'قريباً',
  Live: 'نشط',
  Closed: 'مغلق',
  Completed: 'مكتمل',
  InProgress: 'جارٍ الإنجاز',
};

export function StatusBadge({ status }: { status: string }) {
  const key = status as QuizStatus;
  const cls =
    key === 'Draft'
      ? 'badge-draft'
      : key === 'Upcoming'
      ? 'badge-upcoming'
      : key === 'Live'
      ? 'badge-live'
      : key === 'Closed'
      ? 'badge-closed'
      : key === 'Completed'
      ? 'badge-completed'
      : key === 'InProgress'
      ? 'badge-inprogress'
      : 'badge-draft';
  const label = statusLabel[key] ?? status;
  return <span className={`badge ${cls}`}>{label}</span>;
}

export const formatDateRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Amman',
    });
  return `${fmt(s)} – ${fmt(e)}`;
};
