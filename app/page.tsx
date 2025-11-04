"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Shift = {
  type: "Früh" | "Spät" | "Nacht";
  date: string;
  status: "Muss arbeiten" | "Hat frei";
};

type Cfg = {
  live: boolean;
  ended: boolean;
  start: string | null;
  info: string;
  shifts?: Shift[];
};

export default function HomePage() {
  const [cfg, setCfg] = useState<Cfg>({
    live: false,
    ended: false,
    start: null,
    info: "",
    shifts: [],
  });
  const [now, setNow] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Config laden
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/config", { cache: "no-store" });
        const j = (await r.json()) as Cfg;
        setCfg(j);
      } catch {
        setErr("Konfiguration konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Countdown-Ticker
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startMs = useMemo(() => (cfg.start ? new Date(cfg.start).getTime() : null), [cfg.start]);

  const formatDiff = (diffMs: number) => {
    if (diffMs <= 0) return "00:00:00";
    const totalSec = Math.floor(diffMs / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return d > 0
      ? `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  /* ---------- Styles ---------- */
  const page: CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    background: "#ffffff",
    padding: "32px 24px",
    fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    textAlign: "center",
  };
  const title: CSSProperties = { marginTop: 30, fontSize: 36, fontWeight: 800, letterSpacing: 0.8 };
  const sub: CSSProperties = { marginTop: 30, fontSize: 28, fontWeight: 600, color: "#111" };
  const countdown: CSSProperties = { marginTop: 10, fontSize: 64, fontWeight: 800, letterSpacing: 1.2 };
  const live: CSSProperties = { marginTop: 20, fontSize: 44, fontWeight: 800, color: "#d70080" };
  const ended: CSSProperties = { marginTop: 20, fontSize: 40, fontWeight: 700, color: "#16a34a" };
  const info: CSSProperties = { marginTop: 24, fontSize: 20, color: "#374151", whiteSpace: "pre-wrap", maxWidth: 900 };

  const shiftGrid: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
    marginTop: 30,
  };

  const shiftCard = (status: string): CSSProperties => ({
    width: 260,
    padding: 18,
    borderRadius: 14,
    background: status === "Muss arbeiten" ? "#d70080" : "#e5e7eb",
    color: status === "Muss arbeiten" ? "#fff" : "#111827",
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
    textAlign: "center",
    transition: "transform 0.2s ease",
  });

  const shiftTitle: CSSProperties = { fontSize: 22, fontWeight: 700, marginBottom: 6 };
  const shiftDate: CSSProperties = { fontSize: 16, fontWeight: 500, marginBottom: 6 };
  const shiftStatus: CSSProperties = { fontSize: 18, fontWeight: 600 };

  /* ---------- UI ---------- */
  return (
    <main style={page}>
      {/* Logo oben */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <Image
          src="/tst-logo.png"
          alt="TST Logo"
          width={400}
          height={400}
          priority
          style={{ width: "400px", height: "auto", objectFit: "contain", opacity: 0.98 }}
        />
      </div>

      <h1 style={title}>TST BÖNEN INVENTUR 2025</h1>

      {/* Hauptlogik */}
      {loading ? (
        <p style={{ marginTop: 20, color: "#6b7280", fontSize: 20 }}>…lädt</p>
      ) : err ? (
        <p style={{ marginTop: 20, color: "#dc2626", fontSize: 20 }}>{err}</p>
      ) : cfg.ended ? (
        <div style={ended}>✅ Die Inventur ist beendet.</div>
      ) : cfg.live ? (
        <>
          <div style={live}>✅ Die Inventur ist gestartet.</div>

          {/* Schicht-Boxen */}
          {cfg.shifts && cfg.shifts.length > 0 ? (
            <div style={shiftGrid}>
              {cfg.shifts.map((s, i) => (
                <div key={i} style={shiftCard(s.status)}>
                  <div style={shiftTitle}>{s.type}schicht</div>
                  <div style={shiftDate}>{new Date(s.date).toLocaleDateString("de-DE")}</div>
                  <div style={shiftStatus}>{s.status}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ marginTop: 20, color: "#6b7280", fontSize: 18 }}>
              Keine Schichtinformationen verfügbar.
            </p>
          )}
        </>
      ) : (
        <>
          <p style={sub}>{cfg.start ? "Die Inventur startet in:" : "Startzeit folgt."}</p>
          {cfg.start ? <div style={countdown}>{formatDiff((startMs ?? 0) - now)}</div> : null}
        </>
      )}

      {cfg.info ? <div style={info}>{cfg.info}</div> : null}
    </main>
  );
}
