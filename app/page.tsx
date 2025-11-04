"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

/* ---------- Types ---------- */
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
  shifts?: Shift[]; // API may send array or JSON string (handled below)
};

type Lang = "de" | "en" | "pl" | "ru";

/* ---------- Translations ---------- */
const LOCALE_BY_LANG: Record<Lang, string> = {
  de: "de-DE",
  en: "en-GB",
  pl: "pl-PL",
  ru: "ru-RU",
};

const T = {
  heading_live: {
    de: "Die Inventur ist gestartet.",
    en: "The inventory has started.",
    pl: "Inwentaryzacja została rozpoczęta.",
    ru: "Инвентаризация началась.",
  },
  heading_before_label: {
    de: "Die Inventur startet in:",
    en: "The inventory starts in:",
    pl: "Inwentaryzacja rozpocznie się za:",
    ru: "Инвентаризация начнётся через:",
  },
  heading_before_nostart: {
    de: "Startzeit folgt.",
    en: "Start time to be announced.",
    pl: "Czas rozpoczęcia wkrótce.",
    ru: "Время начала будет объявлено.",
  },
  heading_ended: {
    de: "✅ Die Inventur ist beendet.",
    en: "✅ The inventory has ended.",
    pl: "✅ Inwentaryzacja zakończona.",
    ru: "✅ Инвентаризация завершена.",
  },
  no_shifts: {
    de: "Keine Schichtinformationen verfügbar.",
    en: "No shift information available.",
    pl: "Brak informacji o zmianach.",
    ru: "Нет информации о сменах.",
  },
  // Shift type labels
  shift_morning: {
    de: "Frühschicht",
    en: "Morning shift",
    pl: "Zmiana poranna",
    ru: "Утренняя смена",
  },
  shift_late: {
    de: "Spätschicht",
    en: "Late shift",
    pl: "Zmiana wieczorna",
    ru: "Вечерняя смена",
  },
  shift_night: {
    de: "Nachtschicht",
    en: "Night shift",
    pl: "Zmiana nocna",
    ru: "Ночная смена",
  },
  // Status text (display only; backend keeps German keys)
  status_yes: {
    de: "Findet statt",
    en: "Takes place",
    pl: "Odbywa się",
    ru: "Состоится",
  },
  status_no: {
    de: "Findet nicht statt",
    en: "Does not take place",
    pl: "Nie odbywa się",
    ru: "Не состоится",
  },
};

function tr<K extends keyof typeof T>(key: K, lang: Lang) {
  return T[key][lang];
}

/* ---------- Component ---------- */
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

  // Language (persist in localStorage)
  const [lang, setLang] = useState<Lang>("de");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang") as Lang | null;
      if (saved && ["de", "en", "pl", "ru"].includes(saved)) setLang(saved);
    } catch {}
  }, []);
  const onLangChange = (v: Lang) => {
    setLang(v);
    try {
      localStorage.setItem("lang", v);
    } catch {}
    setOpen(false);
  };

  // Load config (robust parse for shifts)
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

  // Countdown ticker
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
      ? `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  /* ---------- Styles (unchanged design) ---------- */
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
  const sub: CSSProperties = { marginTop: 30, fontSize: 28, fontWeight: 600, color: "#111" };
  const countdown: CSSProperties = { marginTop: 10, fontSize: 64, fontWeight: 800, letterSpacing: 1.2 };
  const liveTitle: CSSProperties = { marginTop: 20, fontSize: 44, fontWeight: 800, color: "#111" }; // black, no emoji
  const ended: CSSProperties = { marginTop: 20, fontSize: 40, fontWeight: 700, color: "#16a34a" };
  const info: CSSProperties = { marginTop: 24, fontSize: 20, color: "#374151", whiteSpace: "pre-wrap", maxWidth: 900 };

  const shiftGrid: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
    marginTop: 30,
  };

  // Tiles as before: compact, strong shadow; green/red by status
  const shiftCard = (status: "Muss arbeiten" | "Hat frei"): CSSProperties => {
    const ok = status === "Muss arbeiten"; // Finds place
    return {
      width: 260,
      padding: 18,
      borderRadius: 14,
      background: ok ? "#16a34a" : "#dc2626", // green / red
      color: "#fff",
      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
      textAlign: "center",
      transition: "transform 0.2s ease",
    };
  };

  const shiftTitle: CSSProperties = { fontSize: 22, fontWeight: 700, marginBottom: 6 }; // Schicht
  const shiftDate: CSSProperties = { fontSize: 16, fontWeight: 500, marginBottom: 6 }; // Datum
  const shiftStatus: CSSProperties = { fontSize: 18, fontWeight: 600 }; // Status

  /* ---------- Language dropdown (flags) ---------- */
  const [open, setOpen] = useState(false);
  const flagOf: Record<Lang, string> = { de: "🇩🇪", en: "🇬🇧", pl: "🇵🇱", ru: "🇷🇺" };

  const flagFab: CSSProperties = {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 50,
  };

  const flagBtn: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
    cursor: "pointer",
    fontSize: 22,
    display: "grid",
    placeItems: "center",
  };

  const flagMenu: CSSProperties = {
    marginTop: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    padding: 6,
    display: "grid",
    gap: 6,
  };

  const flagItem: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 999,
    border: "1px solid #f3f4f6",
    background: "#fff",
    cursor: "pointer",
    fontSize: 22,
    display: "grid",
    placeItems: "center",
  };

  /* ---------- Helpers: display strings by lang ---------- */
  const dateFmt = (iso: string) => {
    const loc = LOCALE_BY_LANG[lang] || "de-DE";
    return new Date(iso).toLocaleDateString(loc);
  };
  const shiftTypeLabel = (t: Shift["type"]) => {
    if (t === "Früh") return tr("shift_morning", lang);
    if (t === "Spät") return tr("shift_late", lang);
    return tr("shift_night", lang);
  };
  const statusText = (s: Shift["status"]) =>
    s === "Muss arbeiten" ? tr("status_yes", lang) : tr("status_no", lang);

  /* ---------- UI ---------- */
  return (
    <main style={page}>
      {/* Floating flag dropdown (top-right) */}
      <div style={flagFab}>
        <button
          aria-label="Language"
          style={flagBtn}
          onClick={() => setOpen((v) => !v)}
          title="Sprache wählen"
        >
          {flagOf[lang]}
        </button>
        {open && (
          <div style={flagMenu}>
            {(["de", "en", "pl", "ru"] as Lang[]).map((l) => (
              <button
                key={l}
                aria-label={l}
                style={flagItem}
                onClick={() => onLangChange(l)}
                title={l.toUpperCase()}
              >
                {flagOf[l]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Original design below (unchanged) */}
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
        <p style={{ marginTop: 20, color: "#6b7280", fontSize: 20 }}>
          {lang === "de"
            ? "…lädt"
            : lang === "en"
            ? "…loading"
            : lang === "pl"
            ? "…ładowanie"
            : "…загрузка"}
        </p>
      ) : err ? (
        <p style={{ marginTop: 20, color: "#dc2626", fontSize: 20 }}>{err}</p>
      ) : cfg.ended ? (
        <div style={ended}>{tr("heading_ended", lang)}</div>
      ) : cfg.live ? (
        <>
          {/* Live heading (no emoji, black) */}
          <div style={liveTitle}>{tr("heading_live", lang)}</div>

          {/* Shift tiles (Schicht → Datum → Status) */}
          {cfg.shifts && Array.isArray(cfg.shifts) && cfg.shifts.length > 0 ? (
            <div style={shiftGrid}>
              {cfg.shifts.map((s, i) => (
                <div key={`${s.type}-${s.date}-${i}`} style={shiftCard(s.status)}>
                  <div style={shiftTitle}>{shiftTypeLabel(s.type)}</div>
                  <div style={shiftDate}>{dateFmt(s.date)}</div>
                  <div style={shiftStatus}>{statusText(s.status)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ marginTop: 20, color: "#6b7280", fontSize: 18 }}>
              {tr("no_shifts", lang)}
            </p>
          )}
        </>
      ) : (
        <>
          <p style={sub}>
            {cfg.start ? tr("heading_before_label", lang) : tr("heading_before_nostart", lang)}
          </p>
          {cfg.start ? <div style={countdown}>{formatDiff((startMs ?? 0) - now)}</div> : null}
        </>
      )}

      {cfg.info ? <div style={info}>{cfg.info}</div> : null}
    </main>
  );
}
