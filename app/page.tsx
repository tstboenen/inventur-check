"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

/* ---------- Typen ---------- */
type Shift = {
  type: "Früh" | "Spät" | "Nacht";
  date: string; // ISO oder YYYY-MM-DD
  status: "Muss arbeiten" | "Hat frei";
};

type Cfg = {
  live: boolean;
  ended: boolean;
  start: string | null; // ISO
  info: string;
  shifts?: Shift[];
};

/* ---------- Countdown Helper ---------- */
function useCountdown(startIso?: string | null) {
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = useMemo(() => {
    if (!startIso) return null;
    const start = new Date(startIso).getTime();
    const delta = Math.max(0, start - now);
    const s = Math.floor(delta / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return { d, h, m, s: sec, ms: delta };
  }, [startIso, now]);
  return diff;
}

/* ---------- UI ---------- */
export default function HomePage() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/config", { cache: "no-store" });
        const j = (await r.json()) as Cfg;

        // Falls Shiftdaten als ISO vorliegen -> für Anzeige Day-string erzeugen
        const safeShifts =
          (j.shifts || []).map((s) => ({
            ...s,
            date: /^\d{4}-\d{2}-\d{2}$/.test(s.date)
              ? s.date
              : new Date(s.date).toISOString().slice(0, 10),
          })) as Shift[];

        setCfg({ ...j, shifts: safeShifts });
      } catch (e) {
        setErr("Konfiguration konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cd = useCountdown(cfg?.start ?? null);

  /* ---------- Styles ---------- */
  const page: CSSProperties = {
    minHeight: "100vh",
    background: "#ffffff",
    display: "grid",
    gridTemplateRows: "auto 1fr",
    gap: 16,
    padding: "28px 20px",
    color: "#111827",
    fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  };

  const container: CSSProperties = {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
  };

  const h1: CSSProperties = {
    fontSize: 28,
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#111111", // schwarz, ohne Emoji
    margin: "0 0 12px 0",
  };

  const sub: CSSProperties = {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 14,
  };

  const infoBox: CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#f9fafb",
    marginTop: 10,
    whiteSpace: "pre-wrap",
  };

  const rowCards: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
    marginTop: 10,
  };

  const cardBase: CSSProperties = {
    borderRadius: 12,
    padding: 14,
    border: "1px solid transparent",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  const cardGreen: CSSProperties = {
    ...cardBase,
    background: "#ecfdf5", // grünlich hell
    borderColor: "#a7f3d0",
  };

  const cardRed: CSSProperties = {
    ...cardBase,
    background: "#fef2f2", // rötlich hell
    borderColor: "#fecaca",
  };

  const statusPill = (ok: boolean): CSSProperties => ({
    display: "inline-block",
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 8px",
    borderRadius: 999,
    background: ok ? "#10b981" : "#ef4444",
    color: "#fff",
  });

  const label: CSSProperties = { fontSize: 12, color: "#6b7280" };
  const val: CSSProperties = { fontSize: 16, fontWeight: 600, color: "#111827" };

  if (loading) {
    return (
      <main style={page}>
        <div style={container}>
          <h1 style={h1}>Inventur-Check</h1>
          <p>…lädt</p>
        </div>
      </main>
    );
  }

  if (err || !cfg) {
    return (
      <main style={page}>
        <div style={container}>
          <h1 style={h1}>Inventur-Check</h1>
          <p style={{ color: "#b91c1c" }}>{err || "Unbekannter Fehler."}</p>
        </div>
      </main>
    );
  }

  /* ---------- Zustände ---------- */
  const isBefore = !cfg.live && !cfg.ended;
  const isLive = cfg.live && !cfg.ended;
  const isEnded = cfg.ended;

  return (
    <main style={page}>
      <div style={container}>
        {/* Kopfzeile je nach Zustand */}
        {isBefore && (
          <>
            <h1 style={h1}>Die Inventur startet in Kürze.</h1>
            {cfg.start && cd && cd.ms > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "baseline",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <div style={{ fontSize: 42, fontWeight: 800 }}>
                  {cd.d}d {String(cd.h).padStart(2, "0")}:
                  {String(cd.m).padStart(2, "0")}:
                  {String(cd.s).padStart(2, "0")}
                </div>
                <div style={{ ...sub, margin: 0 }}>
                  Start: {new Date(cfg.start).toLocaleString()}
                </div>
              </div>
            )}
            {cfg.info?.trim() && (
              <div style={infoBox}>
                <div style={{ fontSize: 14, color: "#111827", fontWeight: 600, marginBottom: 6 }}>
                  Hinweise
                </div>
                <div style={{ fontSize: 14, color: "#374151" }}>{cfg.info}</div>
              </div>
            )}
          </>
        )}

        {isLive && (
          <>
            {/* Überschrift ohne Emoji, schwarz */}
            <h1 style={h1}>Die Inventur ist gestartet.</h1>
            {cfg.info?.trim() && <div style={infoBox}>{cfg.info}</div>}

            {/* Schichtkarten farblich */}
            {(cfg.shifts && cfg.shifts.length > 0) ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ ...sub, color: "#111827", marginBottom: 8, fontWeight: 600 }}>
                  Schichten
                </div>
                <div style={rowCards}>
                  {cfg.shifts!.map((s, i) => {
                    const ok = s.status === "Muss arbeiten"; // -> Findet statt
                    const statusText = ok ? "Findet statt" : "Findet nicht statt";
                    const style = ok ? cardGreen : cardRed;

                    return (
                      <div key={i} style={style}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ ...label, textTransform: "uppercase", letterSpacing: 0.3 }}>
                            {s.type}schicht
                          </div>
                          <span style={statusPill(ok)}>{statusText}</span>
                        </div>

                        <div style={{ display: "grid", gap: 4 }}>
                          <div>
                            <div style={label}>Datum</div>
                            <div style={val}>{s.date}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p style={{ ...sub, color: "#6b7280", marginTop: 10 }}>
                Keine Schichten hinterlegt.
              </p>
            )}
          </>
        )}

        {isEnded && (
          <>
            <h1 style={h1}>Die Inventur ist beendet.</h1>
            {cfg.info?.trim() && <div style={infoBox}>{cfg.info}</div>}
          </>
        )}
      </div>
    </main>
  );
}
