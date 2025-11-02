"use client";
import Image from "next/image";
import { useState, useEffect, type CSSProperties } from "react";

/* ---------- Typen ---------- */
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

/* ---------- Admin Panel ---------- */
function ConfigForm({ onLogout }: { onLogout: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // State
  const [live, setLive] = useState(false);
  const [ended, setEnded] = useState(false);
  const [startLocal, setStartLocal] = useState<string>(""); // datetime-local

  const [headline, setHeadline] = useState("TST BÖNEN INVENTUR 2025");
  const [preText, setPreText] = useState("");
  const [liveText, setLiveText] = useState("");
  const [endText, setEndText] = useState("✅ Die Inventur ist beendet.");
  const [info, setInfo] = useState("");
  const [showCountdown, setShowCountdown] = useState(false);

  // helpers: ISO <-> datetime-local
  const toLocalInput = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  };
  const toIso = (local?: string) => {
    if (!local) return "";
    const d = new Date(local);
    return d.toISOString();
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/config", { cache: "no-store" });
        const cfg = (await r.json()) as Cfg;

        setLive(!!cfg.live);
        setEnded(!!cfg.ended);
        setStartLocal(toLocalInput(cfg.start));

        setHeadline(cfg.headline || "TST BÖNEN INVENTUR 2025");
        setPreText(cfg.preText || "");
        setLiveText(cfg.liveText || "");
        setEndText(cfg.endText || "✅ Die Inventur ist beendet.");
        setInfo(cfg.info || "");
        setShowCountdown(!!cfg.showCountdown);
      } catch {
        setMsg("Fehler beim Laden der Konfiguration.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Slider-Logik:
  // - Wenn "Live" aktiviert wird → Termin-Eingabe wird ausgeblendet.
  // - "Ende" erscheint nur, wenn Live aktiv ist.
  // - Wenn "Ende" aktiviert wird, bleibt Live automatisch aktiv.
  function onToggleLive(next: boolean) {
    if (!next) {
      setEnded(false); // Ende zurücksetzen, wenn Live ausgeschaltet
    }
    setLive(next);
  }
  function onToggleEnded(next: boolean) {
    if (next) setLive(true); // Ende impliziert Live
    setEnded(next);
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const body: Partial<Cfg> = {
        live,
        ended,
        start: !live && startLocal ? toIso(startLocal) : null, // nur senden, wenn Live AUS ist
        headline,
        preText,
        liveText,
        endText,
        info,
        showCountdown,
      };

      const r = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || "Speichern fehlgeschlagen");
      }
      setMsg("✅ Gespeichert");
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "Fehler beim Speichern"));
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 2500);
    }
  }

  /* ---------- Styles ---------- */
  const gridRow: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  };
  const lbl: CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151" };
  const input: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    boxSizing: "border-box",
  };
  const textarea: CSSProperties = { ...input, height: 72, resize: "vertical" as const };
  const bar: CSSProperties = { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 };
  const btn: CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
  };
  const primary: CSSProperties = {
    ...btn,
    background: "#d70080",
    color: "#fff",
    border: "none",
    boxShadow: "0 4px 12px rgba(215,0,128,0.25)",
    fontWeight: 600,
  };

  if (loading) return <p>…lädt</p>;

  return (
    <>
      {/* Live-Slider */}
      <div style={{ ...gridRow, gridTemplateColumns: "160px auto" }}>
        <label style={lbl}>Live</label>
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center", userSelect: "none" }}>
          <input type="checkbox" checked={live} onChange={(e) => onToggleLive(e.target.checked)} />
          <span style={{ fontSize: 14, color: "#374151" }}>{live ? "an" : "aus"}</span>
        </label>
      </div>

      {/* Termin-Eingabe (nur sichtbar, wenn Live AUS ist) */}
      {!live && (
        <div style={gridRow}>
          <label style={lbl}>Termin (Start)</label>
          <input
            type="datetime-local"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            style={input}
          />
        </div>
      )}

      {/* Ende-Slider (nur sichtbar, wenn Live AN ist) */}
      {live && (
        <div style={{ ...gridRow, gridTemplateColumns: "160px auto" }}>
          <label style={lbl}>Ende</label>
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", userSelect: "none" }}>
            <input type="checkbox" checked={ended} onChange={(e) => onToggleEnded(e.target.checked)} />
            <span style={{ fontSize: 14, color: "#374151" }}>{ended ? "aktiv" : "inaktiv"}</span>
          </label>
        </div>
      )}

      {/* Texte */}
      <div style={gridRow}>
        <label style={lbl}>Überschrift</label>
        <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} style={input} placeholder="TST BÖNEN INVENTUR 2025" />
      </div>
      <div style={gridRow}>
        <label style={lbl}>Text vor Start</label>
        <input type="text" value={preText} onChange={(e) => setPreText(e.target.value)} style={input} placeholder="z. B. Start am 14.11. 14:15 Uhr" />
      </div>
      <div style={gridRow}>
        <label style={lbl}>Text während</label>
        <input type="text" value={liveText} onChange={(e) => setLiveText(e.target.value)} style={input} placeholder="z. B. Die Inventur ist gestartet." />
      </div>
      <div style={gridRow}>
        <label style={lbl}>Text nach Ende</label>
        <input type="text" value={endText} onChange={(e) => setEndText(e.target.value)} style={input} placeholder="z. B. ✅ Die Inventur ist beendet." />
      </div>
      <div style={gridRow}>
        <label style={lbl}>Info</label>
        <textarea value={info} onChange={(e) => setInfo(e.target.value)} style={textarea} placeholder="Hinweise an die Mitarbeiter (optional)" />
      </div>

      <div style={{ ...gridRow, gridTemplateColumns: "160px auto" }}>
        <label style={lbl}>Countdown anzeigen</label>
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center", userSelect: "none" }}>
          <input type="checkbox" checked={showCountdown} onChange={(e) => setShowCountdown(e.target.checked)} />
          <span style={{ fontSize: 14, color: "#374151" }}>ja</span>
        </label>
      </div>

      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
        Wenn „Live“ aktiv ist, wird der Termin ausgeblendet. „Ende“ ist nur unter „Live“ verfügbar.
      </div>

      <div style={bar}>
        <button onClick={onLogout} style={btn}>Logout</button>
        <button onClick={save} style={primary} disabled={saving}>{saving ? "Speichert…" : "Speichern"}</button>
      </div>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </>
  );
}

/* ---------- Seite (Login + Panel) ---------- */
export default function AdminPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 80);
    return () => clearTimeout(t);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      if (!r.ok) {
        setError("Falsche Zugangsdaten");
        return;
      }
      setLoggedIn(true);
    } catch {
      setError("Login fehlgeschlagen");
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    setLoggedIn(false);
  }

  /* Styles */
  const page: CSSProperties = {
    minHeight: "100vh",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  };
  const card: CSSProperties = {
    width: "100%",
    maxWidth: 640,
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    padding: 24,
    transition: "opacity 0.35s ease, transform 0.35s ease",
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? "translateY(0px)" : "translateY(12px)",
  };
  const h1: CSSProperties = { fontSize: 22, fontWeight: 600, margin: "16px 0 20px", textAlign: "center" };
  const inputWrap: CSSProperties = { marginBottom: 14 };
  const label: CSSProperties = { display: "block", textAlign: "left", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 };
  const input: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  };
  const button: CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    background: "#d70080",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(215,0,128,0.25)",
    transition: "background 0.2s ease, transform 0.15s ease",
  };
  const buttonHover: CSSProperties = { background: "#b00068", transform: "translateY(-1px)" };

  /* Login */
  if (!loggedIn) {
    return (
      <main style={page}>
        <div style={{ ...card, maxWidth: 420 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Image
              src="/tst-logo.png"
              alt="TST Logo"
              width={200}
              height={200}
              priority
              style={{ width: "200px", height: "auto", objectFit: "contain", opacity: 0.95 }}
            />
          </div>

          <h1 style={h1}>Admin Login</h1>

          <form onSubmit={handleLogin} style={{ textAlign: "left" }}>
            <div style={inputWrap}>
              <label style={label}>Benutzername</label>
              <input type="text" style={input} value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
            </div>

            <div style={inputWrap}>
              <label style={label}>Passwort</label>
              <input type="password" style={input} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
              {error && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 4 }}>{error}</div>}
            </div>

            <button
              type="submit"
              style={hover ? { ...button, ...buttonHover } : button}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              Login
            </button>
          </form>

          <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280", textAlign: "center" }}>
            Zugriff nur für autorisierte Mitarbeiter.
          </div>
        </div>
      </main>
    );
  }

  /* Panel */
  return (
    <main style={page}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/tst-logo.png"
            alt="TST Logo"
            width={200}
            height={200}
            priority
            style={{ width: "200px", height: "auto", objectFit: "contain", opacity: 0.95 }}
          />
        </div>

        <h2 style={{ ...h1, marginTop: 8 }}>Inventur-Einstellungen</h2>
        <ConfigForm onLogout={handleLogout} />
      </div>
    </main>
  );
}
