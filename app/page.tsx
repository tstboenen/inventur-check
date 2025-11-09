"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Shift = { type: "Früh" | "Spät" | "Nacht"; date: string; status: "Muss arbeiten" | "Hat frei" };
type Cfg = { live: boolean; ended: boolean; start: string | null; info: string; shifts?: Shift[] };
type Lang = "de" | "en" | "pl" | "ru";

const LOCALE_BY_LANG: Record<Lang, string> = { de: "de-DE", en: "en-GB", pl: "pl-PL", ru: "ru-RU" };

const T = {
  heading_live: { de: "Die Inventur ist gestartet.", en: "The inventory has started.", pl: "Inwentaryzacja została rozpoczęta.", ru: "Инвентаризация началась." },
  heading_before_label: { de: "Die Inventur startet in:", en: "The inventory starts in:", pl: "Inwentaryzacja rozpocznie się za:", ru: "Инвентаризация начнётся через:" },
  heading_before_nostart: { de: "Startzeit folgt.", en: "Start time to be announced.", pl: "Czas rozpoczęcia wkrótce.", ru: "Время начала будет объявлено." },
  heading_ended: { de: "✅ Die Inventur ist beendet.", en: "✅ The inventory has ended.", pl: "✅ Inwentaryzacja zakończona.", ru: "✅ Инвентаризация завершена." },
  no_shifts: { de: "Keine Schichtinformationen verfügbar.", en: "No shift information available.", pl: "Brak informacji o zmianach.", ru: "Нет информации о сменах." },
  shift_morning: { de: "Frühschicht", en: "Morning shift", pl: "Zmiana poranna", ru: "Утренняя сменa" },
  shift_late: { de: "Spätschicht", en: "Late shift", pl: "Zmiana wieczorna", ru: "Вечерняя сменa" },
  shift_night: { de: "Nachtschicht", en: "Night shift", pl: "Zmiana nocna", ru: "Ночная сменa" },
  status_yes: { de: "Findet statt", en: "Takes place", pl: "Odbywa się", ru: "Состоится" },
  status_no: { de: "Findet nicht statt", en: "Does not take place", pl: "Nie odbywa się", ru: "Не состоится" },
};
function tr<K extends keyof typeof T>(key: K, lang: Lang) { return T[key][lang]; }

export default function HomePage() {
  const [cfg, setCfg] = useState<Cfg>({ live: false, ended: false, start: null, info: "", shifts: [] });
  const [now, setNow] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("de");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang") as Lang | null;
      if (saved && ["de", "en", "pl", "ru"].includes(saved)) setLang(saved);
      else { setLang("de"); localStorage.setItem("lang", "de"); }
    } catch { setLang("de"); }
  }, []);
  const onLangChange = (v: Lang) => { setLang(v); try { localStorage.setItem("lang", v); } catch {} setOpen(false); };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/config", { cache: "no-store", credentials: "include" });
        const raw = await r.json();
        let parsedShifts: Shift[] = [];
        if (Array.isArray(raw.shifts)) parsedShifts = raw.shifts as Shift[];
        else if (typeof raw.shifts === "string") {
          try { const tmp = JSON.parse(raw.shifts); if (Array.isArray(tmp)) parsedShifts = tmp as Shift[]; } catch {}
        }
        setCfg({ live: !!raw.live, ended: !!raw.ended, start: typeof raw.start === "string" ? raw.start : null, info: typeof raw.info === "string" ? raw.info : "", shifts: parsedShifts });
      } catch { setErr("Konfiguration konnte nicht geladen werden."); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const startMs = useMemo(() => (cfg.start ? new Date(cfg.start).getTime() : null), [cfg.start]);
  const formatDiff = (diffMs: number | null) => {
    if (diffMs === null || diffMs <= 0) return "00:00:00";
    const totalSec = Math.floor(diffMs / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return d > 0 ? `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  /* ---------- Styles ---------- */
  const page: CSSProperties = {
    height: "100dvh", boxSizing: "border-box", overflow: "hidden",
    display: "flex", flexDirection: "column", alignItems: "center",
    background: "#ffffff", padding: "32px 24px",
    fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", color: "#111827",
  };
  const content: CSSProperties = { flex: 1, width: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch" as any, textAlign: "center" };

  const title: CSSProperties = { marginTop: 30, fontSize: 36, fontWeight: 800, letterSpacing: 0.8 };
  const sub: CSSProperties = { marginTop: 30, fontSize: 28, fontWeight: 600, color: "#111" };
  const countdown: CSSProperties = { marginTop: 10, fontSize: 64, fontWeight: 800, letterSpacing: 1.2 };
  const liveTitle: CSSProperties = { marginTop: 20, fontSize: 44, fontWeight: 800, color: "#111" };
  const ended: CSSProperties = { marginTop: 20, fontSize: 40, fontWeight: 700, color: "#16a34a" };
  const infoStyle: CSSProperties = { marginTop: 24, fontSize: 20, color: "#374151", whiteSpace: "pre-wrap", maxWidth: 900, marginLeft: "auto", marginRight: "auto" };

  const shiftGrid: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", marginTop: 30, paddingBottom: 24 };
  const shiftCard = (status: "Muss arbeiten" | "Hat frei"): CSSProperties => ({
    width: 260, padding: 18, borderRadius: 14, background: status === "Muss arbeiten" ? "#16a34a" : "#dc2626", color: "#fff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)", textAlign: "center", transition: "transform 0.2s ease",
  });
  const shiftTitle: CSSProperties = { fontSize: 22, fontWeight: 700, marginBottom: 6 };
  const shiftDate: CSSProperties = { fontSize: 16, fontWeight: 500, marginBottom: 6 };
  const shiftStatus: CSSProperties = { fontSize: 18, fontWeight: 600 };

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) { if (!dropdownRef.current) return; if (!dropdownRef.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const flagFab: CSSProperties = { position: "fixed", top: 16, right: 16, zIndex: 50, width: 44, height: 44 };
  const flagBtn: CSSProperties = { width: "100%", height: "100%", borderRadius: 999, border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.10)", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 };
  const flagMenu: CSSProperties = { position: "absolute", top: 52, right: 0, border: "1px solid #e5e7eb", background: "#fff", borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.12)", padding: 6, display: "grid", gap: 6 };
  const flagItem: CSSProperties = { width: 44, height: 30, borderRadius: 8, overflow: "hidden", border: "1px solid #f3f4f6", background: "#fff", cursor: "pointer", padding: 0, display: "grid", placeItems: "center" };
  const FLAG_SRC: Record<Lang, string> = { de: "/flags/de.svg", en: "/flags/en.svg", pl: "/flags/pl.svg", ru: "/flags/ru.svg" };

  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(LOCALE_BY_LANG[lang]);
  const shiftTypeLabel = (t: Shift["type"]) => (t === "Früh" ? tr("shift_morning", lang) : t === "Spät" ? tr("shift_late", lang) : tr("shift_night", lang));
  const statusText = (s: Shift["status"]) => (s === "Muss arbeiten" ? tr("status_yes", lang) : tr("status_no", lang));

  /* ---------- Responsive Logo ---------- */
  const logoStyle: CSSProperties = {
    width: "min(400px, 80vw)",
    height: "auto",
    objectFit: "contain",
    opacity: 0.98,
  };

  /* ---------- UI ---------- */
  return (
    <main style={page}>
      <div style={flagFab} ref={dropdownRef}>
        <button aria-label="Sprache auswählen" style={flagBtn} onClick={() => setOpen((v) => !v)} title="Sprache auswählen">
          <Image src={FLAG_SRC[lang]} alt={lang} width={28} height={18} />
        </button>
        {open && (
          <div style={flagMenu}>
            {(["de", "en", "pl", "ru"] as Lang[]).map((l) => (
              <button key={l} aria-label={l} style={flagItem} onClick={() => onLangChange(l)} title={l.toUpperCase()}>
                <Image src={FLAG_SRC[l]} alt={l} width={44} height={30} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={content}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Image src="/tst-logo.png" alt="TST Logo" width={400} height={400} priority style={logoStyle} />
        </div>

        <h1 style={title}>TST BÖNEN INVENTUR 2025</h1>

        {loading ? (
          <p style={{ marginTop: 20, color: "#6b7280", fontSize: 20 }}>
            {lang === "de" ? "…lädt" : lang === "en" ? "…loading" : lang === "pl" ? "…ładowanie" : "…загрузка"}
          </p>
        ) : err ? (
          <p style={{ marginTop: 20, color: "#dc2626", fontSize: 20 }}>{err}</p>
        ) : cfg.ended ? (
          <div style={ended}>{tr("heading_ended", lang)}</div>
        ) : cfg.live ? (
          <>
            <div style={liveTitle}>{tr("heading_live", lang)}</div>
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
              <p style={{ marginTop: 20, color: "#6b7280", fontSize: 18 }}>{tr("no_shifts", lang)}</p>
            )}
          </>
        ) : (
          <>
            <p style={sub}>{cfg.start ? tr("heading_before_label", lang) : tr("heading_before_nostart", lang)}</p>
            {cfg.start ? <div style={countdown}>{formatDiff((startMs ?? 0) - now)}</div> : null}
          </>
        )}

        {cfg.info ? <div style={infoStyle}>{cfg.info}</div> : null}
      </div>
    </main>
  );
}
