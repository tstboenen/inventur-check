'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import '../globals.css'; // <-- globals.css explizit laden

type Settings = { textVorStart: string; startZeit: string | null };

function toIsoWithBerlinOffset(input: string): string | null {
  if (!input) return null; // erwartet "YYYY-MM-DDTHH:mm"
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;

  const offsetMin = -d.getTimezoneOffset(); // Berlin: +60 Winter / +120 Sommer
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

  // Einstellungen laden
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
      {/* Poppins nur für diese Seite (bleibt unabhängig von globals.css) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      <main className="adm-wrap">
        <div className="adm-card adm-fade">
          {/* Logo oben */}
          <div className="adm-logo">
            <Image
              src="/tst-logo.png"
              alt="TST Logistics"
              width={200}
              height={200}
              priority
            />
          </div>

          {/* Titel */}
          <h1 className="adm-title">Admin – Inventur Einstellungen</h1>

          {loading ? (
            <div className="adm-loading">Lade…</div>
          ) : (
            <form onSubmit={onSave} className="adm-form">
              <label className="adm-label">
                <span>Text vor Start</span>
                <textarea
                  rows={4}
                  className="adm-textarea"
                  value={values.textVorStart}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, textVorStart: e.target.value }))
                  }
                  placeholder="z. B. Die Inventur beginnt am 14.11. um 14:15 Uhr."
                />
              </label>

              <label className="adm-label">
                <span>Startzeit</span>
                <input
                  type="datetime-local"
                  className="adm-input"
                  value={values.startZeit ?? ''}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, startZeit: e.target.value }))
                  }
                />
                <small className="adm-hint">
                  Wird als ISO mit Berlin-Offset gespeichert (z.&nbsp;B.
                  2025-11-14T14:15:00+01:00).
                </small>
              </label>

              <button type="submit" className="adm-button">
                Speichern
              </button>

              {status && <p className="adm-status">{status}</p>}
            </form>
          )}
        </div>
      </main>

      {/* Scoped Styles (styled-jsx) */}
      <style jsx>{`
        :root {
          --pink: #d70080;
          --text: #111;
          --muted: #666;
          --border: #e5e7eb;
          --bg: #ffffff;
          --shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          --radius: 16px;
        }

        .adm-wrap {
          min-height: 100dvh;
          background: var(--bg);
          display: grid;
          place-items: center;
          padding: 24px;
          font-family: 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }

        .adm-card {
          width
