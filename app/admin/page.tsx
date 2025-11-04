"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../admin.css";

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

  const toLocalInput = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };
  const toIso = (local?: string) => {
    if (!local) return "";
    const d = new Date(local);
    return d.toISOString();
  };
  const toDateInput = (maybeIso: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(maybeIso)) return maybeIso;
    const d = new Date(maybeIso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const fromDateInputToIso = (dateOnly: string) =>
    new Date(dateOnly + "T00:00:00Z").toISOString();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/config", { cache: "no-store", credentials: "include" });
        const cfg = (await r.json()) as Cfg;

        if (cfg.ended) {
          setEnded(true);
          setLive(false);
        } else if (cfg.live) {
          setLive(true);
          setEnded(false);
        } else {
          setLive(false);
          setEnded(false);
        }

        setStartLocal(toLocalInput(cfg.start));
        setInfo(cfg.info || "");
        const hydrated = (cfg.shifts || []).map((s) => ({ ...s, date: toDateInput(s.date) })) as Shift[];
        setShifts(hydrated);
      } catch {
        setMsg("Fehler beim Laden der Konfiguration.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  function addShift() {
    if (shifts.length >= 3) return;
    setShifts([
      ...shifts,
      { type: "Früh", date: toDateInput(new Date().toISOString()), status: "Muss arbeiten" },
    ]);
  }
  function updateShift(i: number, field: keyof Shift, value: any) {
    const copy = [...shifts];
    copy[i] = { ...copy[i], [field]: value };
    setShifts(copy);
  }
  function removeShift(i: number) {
    setShifts(shifts.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const normalized = (live ? shifts : []).map((s) => ({
        ...s,
        date: /^\d{4}-\d{2}-\d{2}$/.test(s.date)
          ? fromDateInputToIso(s.date)
          : new Date(s.date).toISOString(),
      }));
      const body: Partial<Cfg> = {
        live,
        ended,
        start: !live && !ended && startLocal ? toIso(startLocal) : null,
        info,
        shifts: live ? normalized : [],
      };
      const r = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as any)?.error || "Speichern fehlgeschlagen");
      }
      setMsg("✅ Gespeichert");
    } catch (e: any) {
      setMsg("❌ " + (e?.message || "Fehler beim Speichern"));
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 2500);
    }
  }

  if (loading) return <p className="admin-loading">…lädt</p>;

  return (
    <>
      {/* Termin */}
      <div className="admin-form" style={{ gridTemplateColumns: "160px 1fr" }}>
        <label className="admin-label" style={{ display: live || ended ? "none" : "grid" }}>
          Termin (Start)
        </label>
        <input
          type="datetime-local"
          value={startLocal}
          onChange={(e) => setStartLocal(e.target.value)}
          className="admin-input"
          style={{ display: live || ended ? "none" : "block" }}
        />
      </div>

      {/* Live */}
      <div className="admin-form" style={{ gridTemplateColumns: "160px 1fr" }}>
        <label className="admin-label">Live</label>
        <div
          role="switch"
          aria-checked={live}
          onClick={() => onToggleLive(!live)}
          style={{
            position: "relative",
            width: 56,
            height: 32,
            cursor: "pointer",
            borderRadius: 999,
            border: `1px solid ${live ? "var(--pink)" : "var(--border)"}`,
            background: live ? "var(--pink)" : "#f3f4f6",
            transition: "all .25s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: live ? 29 : 3,
              width: 26,
              height: 26,
              backgroundColor: "#fff",
              borderRadius: "50%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transition: "left .25s",
            }}
          />
        </div>
      </div>

      {/* Ende */}
      <div className="admin-form" style={{ gridTemplateColumns: "160px 1fr" }}>
        <label className="admin-label">Ende</label>
        <div
          role="switch"
          aria-checked={ended}
          onClick={() => onToggleEnded(!ended)}
          style={{
            position: "relative",
            width: 56,
            height: 32,
            cursor: "pointer",
            borderRadius: 999,
            border: `1px solid ${ended ? "var(--pink)" : "var(--border)"}`,
            background: ended ? "var(--pink)" : "#f3f4f6",
            transition: "all .25s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: ended ? 29 : 3,
              width: 26,
              height: 26,
              backgroundColor: "#fff",
              borderRadius: "50%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transition: "left .25s",
            }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="admin-form" style={{ gridTemplateColumns: "160px 1fr" }}>
        <label className="admin-label">Info</label>
        <textarea
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          className="admin-textarea"
          placeholder="Hinweise an die Mitarbeiter (optional)"
        />
      </div>

      {/* Schichten */}
      {live && (
        <div style={{ marginTop: 16 }}>
          <h3 className="admin-title" style={{ fontSize: "1rem", marginBottom: 10 }}>
            Schichtübersicht
          </h3>
          {(shifts || []).map((shift, i) => (
            <div
              key={i}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <select
                  value={shift.type}
                  onChange={(e) => updateShift(i, "type", e.target.value as Shift["type"])}
                  className="admin-input"
                  style={{ flex: 1 }}
                >
                  <option value="Früh">Frühschicht</option>
                  <option value="Spät">Spätschicht</option>
                  <option value="Nacht">Nachtschicht</option>
                </select>
                <input
                  type="date"
                  value={shift.date}
                  onChange={(e) => updateShift(i, "date", e.target.value)}
                  className="admin-input"
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <select
                  value={shift.status}
                  onChange={(e) => updateShift(i, "status", e.target.value as Shift["status"])}
                  className="admin-input"
                  style={{ flex: 1 }}
                >
                  <option value="Muss arbeiten">Muss arbeiten</option>
                  <option value="Hat frei">Hat frei</option>
                </select>
                <button
                  onClick={() => removeShift(i)}
                  className="admin-button"
                  style={{ background: "#fff", color: "#dc2626", border: "1px solid var(--border)" }}
                >
                  ❌ Löschen
                </button>
              </div>
            </div>
          ))}
          {shifts.length < 3 && (
            <button onClick={addShift} className="admin-button" style={{ marginTop: 8 }}>
              ➕ Schicht hinzufügen
            </button>
          )}
        </div>
      )}

      {/* Bottom Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
        <button
          onClick={() => router.push("/")}
          className="admin-button"
          style={{ background: "#fff", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          Zur Hauptseite
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onLogout}
            className="admin-button"
            style={{ background: "#fff", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            Logout
          </button>
          <button onClick={save} disabled={saving} className="admin-button">
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </div>
      </div>

      {msg && <p className="admin-status">{msg}</p>}
    </>
  );
}

/* ---------- Login + Wrapper ---------- */
export default function AdminPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
    await fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => {});
    setLoggedIn(false);
  }

  /* ---------- LOGIN VIEW ---------- */
  if (!loggedIn) {
    return (
      <main className="admin-wrap">
        <div className="login-box fade-in">
          <div className="login-center">
            <div className="admin-logo">
              <Image src="/tst-logo.png" alt="TST Logo" width={200} height={200} priority />
            </div>

            <h1 className="admin-title">Admin Login</h1>

            <form onSubmit={handleLogin} className="admin-form login-form">
              <label className="admin-label">
                Benutzername
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="admin-input"
                />
              </label>

              <label className="admin-label">
                Passwort
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="admin-input"
                />
              </label>

              {error && <div className="admin-hint" style={{ color: "#dc2626" }}>{error}</div>}

              <button type="submit" className="admin-button login-button">
                Login
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- ADMIN VIEW ---------- */
  return (
    <main className="admin-wrap">
      <div className="admin-card fade-in">
        <div className="admin-logo">
          <Image src="/tst-logo.png" alt="TST Logo" width={200} height={200} priority />
        </div>
        <h2 className="admin-title">Inventur-Einstellungen</h2>
        <ConfigForm onLogout={handleLogout} />
      </div>
    </main>
  );
}
