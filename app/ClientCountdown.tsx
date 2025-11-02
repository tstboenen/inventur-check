// app/ClientCountdown.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = {
  textVorStart: string;
  startZeit: string | null;
};

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function formatRemaining(ms: number): Remaining {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export default function ClientCountdown({ textVorStart, startZeit }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startDate = useMemo(() => {
    if (!startZeit) return null;
    const d = new Date(startZeit);
    return isNaN(d.getTime()) ? null : d;
  }, [startZeit]);

  const diffMs = useMemo(() => {
    if (!startDate) return null;
    return startDate.getTime() - now;
  }, [startDate, now]);

  const remaining = useMemo(() => {
    if (diffMs == null) return null;
    return formatRemaining(diffMs);
  }, [diffMs]);

  const started = diffMs != null && diffMs <= 0;

  const countdownText = useMemo(() => {
    if (startDate === null) return '(Startzeit nicht gesetzt)';
    if (started) return 'Die Inventur ist gestartet';
    const r = remaining!;
    const dd = r.days > 0 ? `${r.days}T ` : '';
    const hh = String(r.hours).padStart(2, '0');
    const mm = String(r.minutes).padStart(2, '0');
    const ss = String(r.seconds).padStart(2, '0');
    return `${dd}${hh}:${mm}:${ss}`;
  }, [startDate, started, remaining]);

  return (
    <>
      <p className="main-line">
        {textVorStart}
        <span className={started ? 'countdown-started' : 'countdown'}>
          {' — '}
          {countdownText}
        </span>
      </p>

      {startDate === null && (
        <div className="help-note">
          Startzeit ist noch nicht gesetzt. Bitte im Admin-Bereich speichern
          (z.&nbsp;B. <code>2025-11-14T14:15:00+01:00</code>).
        </div>
      )}
    </>
  );
}
