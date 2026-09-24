import { useTranslation } from '../i18n/useTranslation';

export type QuizStatus = 'Draft' | 'Upcoming' | 'Live' | 'Closed' | 'Completed' | 'InProgress';

export const statusLabelKey: Record<string, string> = {
  Draft: 'status_draft',
  Upcoming: 'status_upcoming',
  Live: 'status_live',
  Closed: 'status_closed',
  Completed: 'status_completed',
  InProgress: 'status_inProgress',
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
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
  const labelKey = statusLabelKey[status] ?? status;
  const label = t(labelKey);
  return <span className={`badge ${cls}`}>{label}</span>;
}

export const formatDateRange = (start: string, end: string, locale: string = 'en-US') => {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Amman',
    });
  return `${fmt(s)} – ${fmt(e)}`;
};
