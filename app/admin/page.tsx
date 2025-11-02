"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

// ---------- Admin Panel Unterkomponente ----------
function ConfigForm({ onLogout }: { onLogout: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [start, setStart] = useState<string>(""); // datetime-local
  const [end, setEnd] = useState<string>("");
  const [preText, setPreText] = useState("");
  const [liveText, setLiveText] = useState("");
  const [info, setInfo] = useState("");

  // helpers: ISO <-> datetime-local
  const toLocalInput = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
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
        const cfg = await r.json();
        setStart(toLocalInput(cfg.start));
        setEnd(toLocalInput(cfg.end));
        setPreText(cfg.preText || "");
        setLiveText(cfg.liveText || "");
        setInfo(cfg.info || "");
      } catch (e) {
        setMsg("Fehler beim Laden der Konfiguration.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const body = {
        start: start ? toIso(start) : null,
        end: end ? toIso(end) : null,
        preText,
        liveText,
        info,
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

  const row: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151" };
  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    boxSizing: "border-box",
  };
  const textarea: React.CSSProperties = { ...input, height: 72, resize: "vertical" as const };
  const bar: React.CSSProperties = { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 };
  const btn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
  };
  const primary: React.CSSProperties = {
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
      <div style={row}>
        <label style={lbl}>Start</label>
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={input} />
      </div>
      <div style={row}>
        <label style={lbl}>Ende</label>
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} style={input} />
      </div>
      <div style={row}>
        <label style={lbl}>Text vor Start</label>
        <input type="text" value={preText} onChange={(e) => setPreText(e.target.value)} style={input} placeholder="z. B. Start am 14.11. 14:15 Uhr" />
      </div>
      <div style={row}>
        <label style={lbl}>Text während</label>
        <input type="text" value={liveText} onChange={(e) => setLiveText(e.target.value)} style={input} placeholder="z. B. Die Inventur ist gestartet." />
      </div>
      <div style={row}>
        <label style={lbl}>Info</label>
        <textarea value={info} onChange={(e) => setInfo(e.target.value)} style={textarea} placeholder="Hinweise an die Mitarbeiter (optional)" />
      </div>

      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
        Zeiten werden als lokale Zeit eingegeben und als ISO gespeichert.
      </div>

      <div style={bar}>
        <button onClick={onLogout} style={btn}>Logout</button>
        <button onClick={save} style={primary} disabled={saving}>{saving ? "Speichert…" : "Speichern"}</button>
      </div>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </>
  );
}

// ---------- Seite (Login + Panel) ----------
export default function AdminPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
@@ -13,8 +169,8 @@
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 80);
    return () => clearTimeout(timer);
    const t = setTimeout(() => setFadeIn(true), 80);
    return () => clearTimeout(t);
  }, []);

  async function handleLogin(e: React.FormEvent) {
@@ -39,7 +195,6 @@
    setLoggedIn(false);
  }

  // ---------- Styles ----------
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#ffffff",
@@ -55,7 +210,7 @@

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 420,
    maxWidth: 640,
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
@@ -70,22 +225,7 @@
    transform: fadeIn ? "translateY(0px)" : "translateY(12px)",
  };

  const h1: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    margin: "16px 0 20px",
  };

  const label: React.CSSProperties = {
    display: "block",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 6,
  };

  const inputWrap: React.CSSProperties = { marginBottom: 14 };
  const h1: React.CSSProperties = { fontSize: 22, fontWeight: 600, margin: "16px 0 20px" };

  const input: React.CSSProperties = {
    width: "100%",
@@ -97,6 +237,8 @@
    lineHeight: "20px",
    boxSizing: "border-box",
  };
  const inputWrap: React.CSSProperties = { marginBottom: 14 };
  const label: React.CSSProperties = { display: "block", textAlign: "left", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 };

  const button: React.CSSProperties = {
    width: "100%",
@@ -110,67 +252,36 @@
    boxShadow: "0 4px 12px rgba(215,0,128,0.25)",
    transition: "background 0.2s ease, transform 0.15s ease",
  };

  const buttonHover: React.CSSProperties = {
    background: "#b00068",
    transform: "translateY(-1px)",
  };

  const note: React.CSSProperties = {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
  };

  const errorText: React.CSSProperties = {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 4,
    textAlign: "left",
  };
  const buttonHover: React.CSSProperties = { background: "#b00068", transform: "translateY(-1px)" };

  // ---------- Login ----------
  if (!loggedIn) {
    return (
      <main style={page}>
        <div style={card}>
        <div style={{ ...card, maxWidth: 420 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Image
              src="/tst-logo.png"
              alt="TST Logo"
              width={200} // 👈 jetzt 200 px
              width={200}
              height={200}
              priority
              style={{ opacity: 0.95, transition: "opacity 0.5s ease" }}
              style={{ opacity: 0.95 }}
            />
          </div>

          <h1 style={h1}>Admin Login</h1>

          <form onSubmit={handleLogin}>
          <form onSubmit={handleLogin} style={{ textAlign: "left" }}>
            <div style={inputWrap}>
              <label style={label}>Benutzername</label>
              <input
                type="text"
                style={input}
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
              />
              <input type="text" style={input} value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
            </div>

            <div style={inputWrap}>
              <label style={label}>Passwort</label>
              <input
                type="password"
                style={input}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
              />
              {error && <div style={errorText}>{error}</div>}
              <input type="password" style={input} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
              {error && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 4 }}>{error}</div>}
            </div>

            <button
              type="submit"
              style={hover ? { ...button, ...buttonHover } : button}
@@ -181,7 +292,9 @@
            </button>
          </form>

          <div style={note}>Zugriff nur für autorisierte Mitarbeiter.</div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
            Zugriff nur für autorisierte Mitarbeiter.
          </div>
        </div>
      </main>
    );
@@ -190,7 +303,7 @@
  // ---------- Panel ----------
  return (
    <main style={page}>
      <div style={{ ...card, maxWidth: 520 }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/tst-logo.png"
@@ -201,18 +314,8 @@
            style={{ opacity: 0.95 }}
          />
        </div>

        <h2 style={h1}>Willkommen im Adminbereich</h2>
        <p style={{ color: "#6b7280", marginBottom: 18 }}>✅ Erfolgreich eingeloggt.</p>

        <button
          onClick={handleLogout}
          style={hover ? { ...button, ...buttonHover } : button}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          Logout
        </button>
        <h2 style={{ ...h1, marginTop: 8, textAlign: "center" }}>Inventur-Einstellungen</h2>
        <ConfigForm onLogout={handleLogout} />
      </div>
    </main>
  );
