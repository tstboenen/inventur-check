"use client";
import { useEffect, useRef, useState } from "react";

type Cfg = {
  start?: string | null;
  end?: string | null;
  preText?: string;
  liveText?: string;
  info?: string;
};

export default function Page() {
  const [cfg, setCfg] = useState<Cfg>({});
  const [now, setNow] = useState<number>(Date.now());
  const cfgRef = useRef<Cfg>({});

  // Zeitformat für Countdown
  function fmt(ms: number) {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d)}d : ${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;
  }

  // Ableitung des Status aus cfg + now
  function compute() {
    const start = cfgRef.current.start ? new Date(cfgRef.current.start) : null;
    const end = cfgRef.current.end ? new Date(cfgRef.current.end) : null;
    const t = new Date(now);

    if (!start) {
      return {
        headline: "Inventur-Check",
        text: cfgRef.current.preText || "–",
        countdown: "–",
        status: "–",
        statusColor: "#0e1628",
      };
    }

    if (t < start) {
      return {
        headline: "Inventur-Check",
        text: cfgRef.current.preText || "–",
        countdown: "Countdown bis Start: " + fmt(start.getTime() - t.getTime()),
        status: "wartet",
        statusColor: "#0e1628",
      };
    }

    if (end && t < end) {
      return {
        headline: "Inventur-Check",
        text: cfgRef.current.liveText || "Die Inventur ist gestartet.",
        countdown: "Läuft… Restzeit bis Ende: " + fmt(end.getTime() - t.getTime()),
        status: "läuft",
        statusColor: "linear-gradient(180deg,#16a34a,#15803d)",
      };
    }

    if (end && t >= end) {
      return {
        headline: "Inventur-Check",
        text: cfgRef.current.liveText || "Die Inventur ist gestartet.",
        countdown: "Beendet",
        status: "beendet",
        statusColor: "linear-gradient(180deg,#dc2626,#b91c1c)",
      };
    }

    // Start erreicht, aber kein Enddatum gesetzt
    return {
      headline: "Inventur-Check",
      text: cfgRef.current.liveText || "Die Inventur ist gestartet.",
      countdown: "Gestartet",
      status: "gestartet",
      statusColor: "linear-gradient(180deg,#16a34a,#15803d)",
    };
  }

  // Config laden
  async function loadConfig() {
    const r = await fetch("/api/config", { cache: "no-store" });
    const j = (await r.json()) as Cfg;
    cfgRef.current = j || {};
    setCfg(j || {});
  }

  useEffect(() => {
    // Initial laden
    loadConfig().catch(() => {});

    // Jede Sekunde „tick“
    const tick = setInterval(() => setNow(Date.now()), 1000);

    // Alle 30 s Config erneut holen (falls im Admin geändert)
    const poll = setInterval(() => loadConfig().catch(() => {}), 30000);

    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, []);

  const view = compute();

  // einfache Styles (kein Tailwind nötig)
  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  };
  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: 24,
  };
  const h1: React.CSSProperties = { fontWeight: 800, margin: 0, fontSize: 28 };
  const text: React.CSSProperties = { marginTop: 8, fontSize: 16 };
  const countdown: React.CSSProperties = {
    marginTop: 12,
    fontVariantNumeric: "tabular-nums",
    fontSize: 22,
    fontWeight: 700,
  };
  const info: React.CSSProperties = { color: "#6b7280", marginTop: 10 };
  const status: React.CSSProperties = {
    marginTop: 20,
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: 999,
    background: "#0e1628",
    border: "1px solid rgba(148,163,184,.2)",
    color: "#fff",
  };

  return (
    <main style={wrap}>
      <div style={card}>
        <h1 style={h1}>{view.headline}</h1>
        <p style={text}>{view.text || "–"}</p>
        <div style={countdown}>{view.countdown}</div>
        <p style={info}>{cfg.info || ""}</p>
        <div style={{ ...status, background: view.statusColor }}>
          Status: {view.status}
        </div>
      </div>
    </main>
  );
}
