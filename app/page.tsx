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

  // Config laden (shifts robust parsen)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/config", { cache: "no-store", credentials: "include" });
        const raw = await r.json();

        let parsedShifts: Shift[] = [];
        if (Array.isArray(raw.shifts)) {
          parsedShifts = raw.shifts as Shift[];
        } else if (typeof raw.shifts === "string") {
          try {
            const tmp = JSON.parse(raw.shifts);
            if (Array.isArray(tmp)) parsedShifts = tmp as Shift[];
          } catch {
            parsedShifts = [];
          }
        }

        const nextCfg: Cfg = {
          live: !!raw.live,
          ended: !!raw.ended,
          start: typeof raw.start === "string" ? raw.start : null,
          info: typeof raw.info === "string" ? raw.info : "",
          shifts: parsedShifts,
        };

        setCfg(nextCfg);
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

  const formatDiff = (diffMs: number | null) => {
    if (diffMs === null || diffMs <= 0) return "00:00:00";
    const totalSec = Math.floor(diffMs / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return d > 0
      ? `${d}D ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
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
    color: "#111827",
  };
  const title: CSSProperties = { marginTop: 30, fontSize: 36, fontWeight: 800, letterSpacing: 0.8 };
  const sub: CSSProperties = { marginTop: 30, fontSize: 28, color: "#111" };
  const countdown: CSSProperties = { marginTop: 10, fontSize: 64, fontWeight: 800, letterSpacing: 1.2 };
  const liveTitle: CSSProperties = { marginTop: 20, fontSize: 44, color: "#111" };
  const ended: CSSProperties = { marginTop: 20, fontSize: 40, color: "#16a34a" };
  const info: CSSProperties = { marginTop: 24, fontSize: 20, color: "#374151", whiteSpace: "pre-wrap", maxWidth: 900 };

  const shiftGrid: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
    marginTop: 30,
  };

  const shiftCard = (status: "Muss arbeiten" | "Hat frei"): CSSProperties => {
    const ok = status === "Muss arbeiten";
    return {
      width: 260,
      padding: 18,
      borderRadius: 14,
      background: ok ? "#16a34a" : "#dc2626",
      color: "#fff",
      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
      textAlign: "center",
      textTransform: "uppercase", // 🔠 alles in Großbuchstaben
      transition: "transform 0.2s ease",
    };
  };

  const equalSize = 26;
  const rowStyle: CSSProperties = {
    fontSize: equalSize,
    fontWeight: 400,
    marginBottom: 6,
    letterSpacing: 0.5,
  };

  /* ---------- UI ---------- */
  return (
    <main style={page}>
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

      {loading ? (
        <p style={{ marginTop: 20, color: "#6b7280", fontSize: 20 }}>…LÄDT</p>
      ) : err ? (
        <p style={{ marginTop: 20, color: "#dc2626", fontSize: 20 }}>{err.toUpperCase()}</p>
      ) : cfg.ended ? (
        <div style={ended}>✅ DIE INVENTUR IST BEENDET.</div>
      ) : cfg.live ? (
        <>
          <div style={liveTitle}>DIE INVENTUR IST GESTARTET.</div>

          {cfg.shifts && Array.isArray(cfg.shifts) && cfg.shifts.length > 0 ? (
            <div style={shiftGrid}>
              {cfg.shifts.map((s, i) => {
                const ok = s.status === "Muss arbeiten";
                const statusText = ok ? "FINDET STATT" : "FINDET NICHT STATT";
                return (
                  <div key={`${s.type}-${s.date}-${i}`} style={shiftCard(s.status)}>
                    <div style={rowStyle}>
                      {new Date(s.date).toLocaleDateString("de-DE").toUpperCase()}
                    </div>
                    <div style={rowStyle}>{`${s.type}SCHICHT`.toUpperCase()}</div>
                    <div style={{ ...rowStyle, marginBottom: 0 }}>{statusText}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ marginTop: 20, color: "#6b7280", fontSize: 18 }}>KEINE SCHICHTINFORMATIONEN VERFÜGBAR.</p>
          )}
        </>
      ) : (
        <>
          <p style={sub}>{cfg.start ? "DIE INVENTUR STARTET IN:" : "STARTZEIT FOLGT."}</p>
          {cfg.start ? <div style={countdown}>{formatDiff((startMs ?? 0) - now)}</div> : null}
        </>
      )}

      {cfg.info ? <div style={info}>{cfg.info.toUpperCase()}</div> : null}
    </main>
  );
}
