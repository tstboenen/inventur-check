"use client";
import Image from "next/image";
import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

/* ---------- Typen ---------- */
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

/* ---------- Admin Panel ---------- */
function ConfigForm({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [live, setLive] = useState(false);
  const [ended, setEnded] = useState(false);
  const [startLocal, setStartLocal] = useState<string>("");
  const [info, setInfo] = useState("");
  const [shifts, setShifts] = useState<Shift[]>([]);

  /* ---------- Helpers ---------- */
  const toLocalInput = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const toIso = (local?: string) => {
    if (!local) return "";
    const d = new Date(local);
    return d.toISOString();
  };

  /* ---------- Config laden ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/config", { cache: "no-store" });
        const cfg = (await r.json()) as Cfg;

        setLive(!!cfg.live);
        setEnded(!!cfg.ended);
        setStartLocal(toLocalInput(cfg.start));
        setInfo(cfg.info || "");
        setShifts(cfg.shifts || []);
      } catch {
        setMsg("Fehler beim Laden der Konfiguration.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- Logik ---------- */
  function onToggleLive(next: boolean) {
    if (next) {
      setLive(true);
      setEnded(false);
    } else {
      setLive(false);
      setShifts([]);
    }
  }

  function onToggleEnded(next: boolean) {
    if (next) {
      setEnded(true);
      setLive(false);
      setShifts([]);
    } else {
      setEnded(false);
    }
  }

  /* ---------- Schichtboxen ---------- */
  function addShift() {
    if (shifts.length >= 3) return;
    setShifts([
      ...shifts,
      {
        type: "Früh",
        date: new Date().toISOString().split("T")[0],
        status: "Muss arbeiten",
      },
    ]);
  }

  function updateShift(index: number, field: keyof Shift, value: any) {
    const copy = [...shifts];
    copy[index] = { ...copy[index], [field]: value };
    setShifts(copy);
  }

  function removeShift(index: number) {
    setShifts(shifts.filter((_, i) => i !== index));
  }

  /* ---------- Speichern ---------- */
  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const body: Partial<Cfg> = {
        live,
        ended,
        start: !live && !ended && startLocal ? toIso(startLocal) : null,
        info,
        shifts: live ? shifts : [],
      };

      // 👇 Debug-Ausgabe im Browser
      console.log("SAVE BODY:", JSON.stringify(body, null, 2));

      const r = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await r.json().catch(() => ({}));
      console.log("API RESPONSE:", result);

      if (!r.ok) {
        throw new Error(result?.error || "Speichern fehlgeschlagen");
      }

      setMsg("✅ Gespeichert");
    } catch (e: any) {
      console.error("SAVE ERROR:", e);
      setMsg("❌ " + (e?.message || "Fehler beim Speichern"));
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
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
  };
  const textarea: CSSProperties = { ...input, height: 72, resize: "vertical" as const };
  const barContainer: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  };
  const barRight: CSSProperties = { display: "flex", gap: 10 };
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
  const shiftCard: CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    background: "#f9fafb",
  };

  if (loading) return <p>…lädt</p>;

  /* ---------- UI ---------- */
  return (
    <>
      {/* Termin */}
      <div style={{ ...gridRow, display: live || ended ? "none" : "grid" }}>
        <label style={lbl}>Termin (Start)</label>
        <input
          type="datetime-local"
          value={startLocal}
          onChange={(e) => setStartLocal(e.target.value)}
          style={input}
        />
      </div>

      {/* Live */}
      <div style={gridRow}>
        <label style={lbl}>Live</label>
        <div
          style={{ position: "relative", width: 50, height: 28, cursor: "pointer" }}
          onClick={() => onToggleLive(!live)}
        >
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: live ? "#d70080" : "#d1d5db",
              transition: "0.3s",
              borderRadius: 34,
            }}
          ></span>
          <span
            style={{
              position: "absolute",
              height: 22,
              width: 22,
              left: live ? 26 : 4,
              bottom: 3,
              backgroundColor: "#fff",
              transition: "0.3s",
              borderRadius: "50%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          ></span>
        </div>
      </div>

      {/* Ende */}
      <div style={gridRow}>
        <label style={lbl}>Ende</label>
        <div
          style={{ position: "relative", width: 50, height: 28, cursor: "pointer" }}
          onClick={() => onToggleEnded(!ended)}
        >
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: ended ? "#d70080" : "#d1d5db",
              transition: "0.3s",
              borderRadius: 34,
            }}
          ></span>
          <span
            style={{
              position: "absolute",
              height: 22,
              width: 22,
              left: ended ? 26 : 4,
              bottom: 3,
              backgroundColor: "#fff",
              transition: "0.3s",
              borderRadius: "50%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          ></span>
        </div>
      </div>

      {/* Info */}
      <div style={gridRow}>
        <label style={lbl}>Info</label>
        <textarea
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          style={textarea}
          placeholder="Hinweise an die Mitarbeiter (optional)"
        />
      </div>

      {/* Schichtboxen */}
      {live && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Schichtübersicht</h3>

          {shifts.map((shift, i) => (
            <div key={i} style={shiftCard}>
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <select
                  value={shift.type}
                  onChange={(e) => updateShift(i, "type", e.target.value as Shift["type"])}
                  style={{ ...input, flex: 1 }}
                >
                  <option value="Früh">Frühschicht</option>
                  <option value="Spät">Spätschicht</option>
                  <option value="Nacht">Nachtschicht</option>
                </select>
                <input
                  type="date"
                  value={shift.date}
                  onChange={(e) => updateShift(i, "date", e.target.value)}
                  style={{ ...input, flex: 1 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <select
                  value={shift.status}
                  onChange={(e) => updateShift(i, "status", e.target.value as Shift["status"])}
                  style={{ ...input, flex: 1 }}
                >
                  <option value="Muss arbeiten">Muss arbeiten</option>
                  <option value="Hat frei">Hat frei</option>
                </select>

                <button onClick={() => removeShift(i)} style={{ ...btn, color: "#dc2626" }}>
                  ❌ Löschen
                </button>
              </div>
            </div>
          ))}

          {shifts.length < 3 && (
            <button onClick={addShift} style={{ ...btn, marginTop: 10 }}>
              ➕ Schicht hinzufügen
            </button>
          )}
        </div>
      )}

      {/* Buttons unten */}
      <div style={barContainer}>
        <button onClick={() => router.push("/")} style={btn}>
          Zur Hauptseite
        </button>

        <div style={barRight}>
          <button onClick={onLogout} style={btn}>
            Logout
          </button>
          <button onClick={save} style={primary} disabled={saving}>
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </div>
      </div>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </>
  );
}

/* ---------- Login + Panel ---------- */
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
    maxWidth: 480,
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(20px)",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    padding: 24,
    transition: "opacity 0.35s ease, transform 0.35s ease",
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? "translateY(0)" : "translateY(12px)",
  };
  const h1: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    margin: "16px 0 20px",
    textAlign: "center",
  };

  if (!loggedIn) {
    return (
      <main style={page}>
        <div style={{ ...card, maxWidth: 420 }}>
          <Image src="/tst-logo.png" alt="TST Logo" width={200} height={200} priority />
          <h1 style={h1}>Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Benutzername"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
            <input
              type="password"
              placeholder="Passwort"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            <button type="submit">Login</button>
            {error && <div style={{ color: "#dc2626" }}>{error}</div>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <div style={card}>
        <Image src="/tst-logo.png" alt="TST Logo" width={200} height={200} priority />
        <h2 style={{ ...h1, marginTop: 8 }}>Inventur-Einstellungen</h2>
        <ConfigForm onLogout={handleLogout} />
      </div>
    </main>
  );
}
