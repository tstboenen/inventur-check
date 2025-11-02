"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

// Struktur wie in /api/config
type Cfg = {
  start: string | null;
  end: string | null;
  preText: string;
  liveText: string;
  info: string;
};

export default function HomePage() {
  const [cfg, setCfg] = useState<Cfg>({
    start: null,
    end: null,
    preText: "",
    liveText: "",
    info: "",
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

  // Ticker für Countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Zeiten parsen
  const startMs = useMemo(() => (cfg.start ? new Date(cfg.start).getTime() : null), [cfg.start]);
  const endMs = useMemo(() => (cfg.end ? new Date(cfg.end).getTime() : null), [cfg.end]);

  // Status bestimmen
  const status: "before" | "live" | "ended" | "unset" = useMemo(() => {
    if (!startMs) return "unset";
    if (now < startMs) return "before";
    if (endMs && now >= endMs) return "ended";
    return "live";
  }, [now, startMs, endMs]);

  // Countdown formatter
  function formatDiff(diffMs: number) {
    if (diffMs <= 0) return "00:00:00";
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
    }

  const page: CSSProperties = {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#ffffff",
    padding: "24px",
    textAlign: "center",
    fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  };

  const wrap: CSSProperties = {
    width: "100%",
    maxWidth: 900,
  };

  const title: CSSProperties = {
    marginTop: 10,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0.6,
  };

  const sub: CSSProperties = {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 600,
    color: "#111",
  };

  const countdown: CSSProperties = {
    marginTop: 8,
    fontSize: 42,
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: 1,
  };

  const live: CSSProperties = {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 700,
    color: "#0ea5e9",
  };

  const ended: CSSProperties = {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 700,
    color: "#16a34a",
  };

  const info: CSSProperties = {
    marginTop: 18,
    fontSize: 16,
    color: "#374151",
    whiteSpace: "pre-wrap",
  };

  return (
    <main style={page}>
      <div style={wrap}>
        {/* Logo 400px breit, nicht verzerrt */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/tst-logo.png"
            alt="TST Logo"
            width={400}
            height={400}
            priority
            style={{ width: "400px", height: "auto", objectFit: "contain", opacity: 0.98 }}
          />
        </div>

        {/* Titel */}
        <h1 style={title}>TST BÖNEN INVENTUR 2025</h1>

        {/* Statusbereich */}
        {loading ? (
          <p style={{ marginTop: 14, color: "#6b7280" }}>…lädt</p>
        ) : err ? (
          <p style={{ marginTop: 14, color: "#dc2626" }}>{err}</p>
        ) : status === "unset" ? (
          <>
            <p style={sub}>{cfg.preText || "Startzeit folgt."}</p>
          </>
        ) : status === "before" ? (
          <>
            <p style={sub}>{cfg.preText || "Die Inventur startet in:"}</p>
            <div style={countdown}>
              {startMs ? formatDiff(startMs - now) : "—"}
            </div>
          </>
        ) : status === "live" ? (
          <>
            <div style={live}>{cfg.liveText || "✅ Die Inventur ist gestartet."}</div>
            {/* Optional: Restzeit bis Ende anzeigen */}
            {endMs ? (
              <div style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>
                Bis Ende: {formatDiff(endMs - now)}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div style={ended}>✅ Die Inventur ist beendet.</div>
          </>
        )}

        {/* Info-Block (immer sichtbar, falls befüllt) */}
        {cfg.info ? <div style={info}>{cfg.info}</div> : null}
      </div>
    </main>
  );
}
