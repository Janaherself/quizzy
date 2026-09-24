import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface TimerProps {
  deadline: string;
  onExpire?: () => void;
  criticalThresholdMs?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function Timer({ deadline, onExpire, criticalThresholdMs = 60000 }: TimerProps) {
  const { t } = useTranslation();
  const target = new Date(deadline).getTime();
  const computeRemaining = () => Math.max(0, target - Date.now());

  const [remaining, setRemaining] = useState(computeRemaining);
  const [critical, setCritical] = useState(false);

  useEffect(() => {
    const tick = () => {
      const r = computeRemaining();
      setRemaining(r);
      setCritical(r <= criticalThresholdMs);
      if (r <= 0 && onExpire) {
        onExpire();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, onExpire, criticalThresholdMs]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div
      className={`timer ${critical ? 'critical' : ''}`}
      role="timer"
      aria-label={remaining <= 0 ? t('timer_timeUp') : t('timer_timeRemaining')}
    >
      {remaining <= 0
        ? t('timer_timeUp')
        : `${pad(minutes)}:${pad(seconds)}`}
    </div>
  );
}
