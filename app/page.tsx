// app/page.tsx
'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import './home.css';

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

export default function Page() {
  const [adminText, setAdminText] = useState<string>('Text vor Start');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Admin-Werte aus localStorage holen
  useEffect(() => {
    try {
      const txt = window.localStorage.getItem('textVorStart');
      if (txt && txt.trim()) setAdminText(txt);

      const raw = window.localStorage.getItem('startZeit');
      if (raw && raw.trim()) {
        // Versuche ISO oder Timestamp zu parsen
        const parsed =
          /^\d+$/.test(raw.trim()) ? new Date(Number(raw.trim())) : new Date(raw.trim());
        if (!isNaN(parsed.getTime())) setStartTime(parsed);
      }
    } catch {
      // bleibt bei Defaults
    }
  }, []);

  // Ticker für Countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diffMs = useMemo(() => {
    if (!startTime) return null;
    return startTime.getTime() - now;
  }, [startTime, now]);

  const remaining = useMemo(() => {
    if (diffMs == null) return null;
    return formatRemaining(diffMs);
  }, [diffMs]);

  const started = diffMs != null && diffMs <= 0;

  const countdownText = useMemo(() => {
    if (diffMs == null) return '(Startzeit nicht gesetzt)';
    if (started) return 'Die Inventur ist gestartet';
    const r = remaining!;
    // Anzeige: 12T 03:15:09 (kompakt, passt „hinter“ den Text)
    const dd = r.days > 0 ? `${r.days}T ` : '';
    const hh = String(r.hours).padStart(2, '0');
    const mm = String(r.minutes).padStart(2, '0');
    const ss = String(r.seconds).padStart(2, '0');
    return `${dd}${hh}:${mm}:${ss}`;
  }, [diffMs, remaining, started]);

  return (
    <main className="main-container">
      {/* Logo oben mittig */}
      <Image
        src="/tst-logo.png"
        alt="TST Logistics"
        width={400}
        height={400}
        priority
        className="main-logo"
      />

      {/* Titel */}
      <h1 className="main-title">TST BÖNEN INVENTUR 2025</h1>

      {/* Admin-Text + Countdown dahinter (gleiche Zeile, falls Platz) */}
      <p className="main-line">
        {adminText}
        {started ? (
          <span className="countdown-started"> — {countdownText}</span>
        ) : (
          <span className="countdown"> — {countdownText}</span>
        )}
      </p>

      {/* Kleiner Hinweis (nur sichtbar, wenn Startzeit fehlt) */}
      {startTime === null && (
        <div className="help-note">
          Setze im Admin-Bereich:
          <br />
          <code>localStorage.setItem('textVorStart', 'Dein Text')</code>
          <br />
          <code>localStorage.setItem('startZeit', '2025-11-14T14:15:00')</code>
        </div>
      )}
    </main>
  );
}
