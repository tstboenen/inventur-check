'use client';

import { useEffect, useState } from 'react';

type Settings = { textVorStart: string; startZeit: string | null };

function toIsoWithBerlinOffset(input: string): string | null {
  // Erwartet "YYYY-MM-DDTHH:mm" (vom <input type="datetime-local">)
  if (!input) return null;
  // Browser interpretiert ohne Offset als lokale Zeit:
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;

  // Offset in Minuten (z. B. Berlin: -60 im Winter, -120 im Sommer)
  const offsetMin = -d.getTimezoneOffset(); // invertiert, damit +60 => +01:00
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');

  // input hat meist keine Sekunden – fügen wir ":00" an
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

  // Aktuelle Settings laden
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const data = await res.json();
        setValues({
          textVorStart: data.textVorStart ?? 'Text vor Start',
          // Für das Input-Feld brauchen wir "YYYY-MM-DDTHH:mm"
          startZeit: data.startZeit
            ? data.startZeit.slice(0, 16) // ISO einkürzen (Sekunden/Offset ab)
            : ''
        });
      } catch (e) {
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
      // Nach erfolgreichem Speichern nochmal frisch laden (Beweis, dass es "genommen" wurde)
      const fresh = await fetch('/api/settings', { cache: 'no-store' }).then((r) => r.json());
      // startZeit wieder für das Input normalisieren
      setValues({
        textVorStart: fresh.textVorStart ?? '',
        startZeit: fresh.startZeit ? fresh.startZeit.slice(0, 16) : ''
      });
    } catch (err: any) {
      setStatus(`Fehler ❌: ${err.message}`);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Lade…</div>;

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Admin – Inventur Einstellungen</h1>

      <form onSubmit={onSave} style={{ display: 'grid', gap: 14 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Text vor Start</span>
          <textarea
            rows={4}
            value={values.textVorStart}
            onChange={(e) => setValues((v) => ({ ...v, textVorStart: e.target.value }))}
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Startzeit</span>
          <input
            type="datetime-local"
            value={values.startZeit ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, startZeit: e.target.value }))}
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
          <small style={{ color: '#666' }}>
            Wird automatisch als ISO mit Berlin-Offset gespeichert (z.&nbsp;B. 2025-11-14T14:15:00+01:00).
          </small>
        </label>

        <button
          type="submit"
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            background: '#d70080',
            color: 'white'
          }}
        >
          Speichern
        </button>
      </form>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}

      <div style={{ marginTop: 24, fontSize: 14, color: '#444' }}>
        <div>Debug: <a href="/api/settings" target="_blank" rel="noreferrer">/api/settings</a> zeigt den aktuellen Stand.</div>
      </div>
    </main>
  );
}
