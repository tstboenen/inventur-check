'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import '../globals.css'; // globale Styles

type Settings = { textVorStart: string; startZeit: string | null };

function toIsoWithBerlinOffset(input: string): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;

  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  const withSeconds = input.length === 16 ? `${input}:00` : input;

  return `${withSeconds}${sign}${hh}:${mm}`;
}

export default function AdminPage() {
  const [values, setValues] = useState<Settings>({
    textVorStart: 'Text vor Start',
    startZeit: ''
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const data = await res.json();
        setValues({
          textVorStart: data.textVorStart ?? 'Text vor Start',
          startZeit: data.startZeit ? String(data.startZeit).slice(0, 16) : ''
        });
      } catch {
        setStatus('Fehler beim Laden der Einstellungen.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Speichere …');
    try {
      const isoOrNull =
        values.startZeit && values.startZeit.trim()
          ? toIsoWithBerlinOffset(values.startZeit.trim())
          : null;

      if (values.startZeit && !isoOrNull) {
        setStatus('Fehler ❌: Ungültige Startzeit. Bitte Datum/Uhrzeit prüfen.');
        return;
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textVorStart: values.textVorStart,
          startZeit: isoOrNull
        })
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }

      setStatus('Gespeichert ✅');
    } catch (err: any) {
      setStatus(`Fehler ❌: ${err.message}`);
    }
  }

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main className="admin-wrap">
        <div className="admin-card fade-in">
          {/* Logo */}
          <div className="admin-logo">
            <Image
              src="/tst-logo.png"
              alt="TST Logistics"
              width={200}
              height={200}
              priority
            />
          </div>

          {/* Titel */}
          <h1 className="admin-title">Admin – Inventur Einstellungen</h1>

          {loading ? (
            <div className="admin-loading">Lade…</div>
          ) : (
            <form onSubmit={onSave} className="admin-form">
              <label className="admin-label">
                <span>Text vor Start</span>
                <textarea
                  rows={4}
                  className="admin-textarea"
                  value={values.textVorStart}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, textVorStart: e.target.value }))
                  }
                  placeholder="z. B. Die Inventur beginnt am 14.11. um 14:15 Uhr."
                />
              </label>

              <label className="admin-label">
                <span>Startzeit</span>
                <input
                  type="datetime-local"
                  className="admin-input"
                  value={values.startZeit ?? ''}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, startZeit: e.target.value }))
                  }
                />
                <small className="admin-hint">
                  Wird als ISO mit Berlin-Offset gespeichert (z.&nbsp;B.
                  2025-11-14T14:15:00+01:00).
                </small>
              </label>

              <button type="submit" className="admin-button">
                Speichern
              </button>

              {status && <p className="admin-status">{status}</p>}
            </form>
          )}
        </div>
      </main>
    </>
  );
}
