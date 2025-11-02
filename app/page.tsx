"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Cfg = {
  live: boolean;
  ended: boolean;
  start: string | null;

  headline: string;
  preText: string;
  liveText: string;
  endText: string;
  info: string;
  showCountdown: boolean;
};

export default function HomePage() {
  const [cfg, setCfg] = useState<Cfg>({
    live: false,
    ended: false,
    start: null,
    headline: "TST BÖNEN INVENTUR 2025",
    preText: "",
    liveText: "",
    endText: "✅ Die Inventur ist beendet.",
    info: "",
    showCountdown: false,
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

  // Ticker für Countdown (nur relevant, wenn live=false && Termin gesetzt)
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
  const title: CSSProperties = {
    marginTop: 30,
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: 0.8,
  };
  const sub: CSSProperties = {
    marginTop: 30,
    fontSize: 28,
    fontWeight: 600,
    color: "#111",
  };
  const countdown: CSSProperties = {
    marginTop: 10,
    fontSize: 64,
    fontWeight: 800,
    letterSpacing: 1.2,
  };
  const live: CSSProperties = {
    marginTop: 20,
    fontSize: 44,
    fontWeight: 800,
    color: "#d70080",
  };
  const ended: CSSProperties = {
    marginTop: 20,
    fontSize: 40,
    fontWeight: 700,
    color: "#16a34a",
  };
  const info: CSSProperties = {
    marginTop: 24,
    fontSize: 20,
    color: "#374151",
    whiteSpace: "pre-wrap",
    maxWidth: 900,
  };

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

      {/* Überschrift */}
      <h1 style={title}>{cfg.headline || "TST BÖNEN INVENTUR 2025"}</h1>

      {/* Inhalt über Slider-Logik */}
      {loading ? (
        <p style={{ marginTop: 20, color: "#6b7280", fontSize: 20 }}>…lädt</p>
      ) : err ? (
        <p style={{ marginTop: 20, color: "#dc2626", fontSize: 20 }}>{err}</p>
      ) : cfg.ended ? (
        <div style={ended}>{cfg.endText || "✅ Die Inventur ist beendet."}</div>
      ) : cfg.live ? (
        <>
          <div style={live}>{cfg.liveText || "✅ Die Inventur ist gestartet."}</div>
        </>
      ) : (
        <>
          <p style={sub}>{cfg.preText || "Die Inventur startet in:"}</p>
          {cfg.showCountdown && startMs ? (
            <div style={countdown}>{formatDiff(startMs - now)}</div>
          ) : null}
        </>
      )}

      {cfg.info ? <div style={info}>{cfg.info}</div> : null}
    </main>
  );
}
