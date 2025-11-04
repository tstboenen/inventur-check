"use client";
import Image from "next/image";
import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

/* ---------- Typen ---------- */
type Shift = {
  type: "Früh" | "Spät" | "Nacht";
  date: string; // im UI "YYYY-MM-DD", zum Server ISO
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
    // akzeptiert sowohl "YYYY-MM-DD" als auch ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(maybeIso)) return maybeIso;
    const d = new Date(maybeIso);
    if (isNaN(d.getTime())) return ""; // falls unlesbar
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const fromDateInputToIso = (dateOnly: string) => {
    // "YYYY-MM-DD" → ISO Mitternacht UTC
    return new Date(dateOnly + "T00:00:00Z").toISOString();
  };

  /* ---------- Config laden ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/config", { cache: "no-store", credentials: "include" });
        const cfg = (await r.json()) as Cfg;

        const live0 = !!cfg.live;
        const ended0 = !!cfg.ended;

        if (ended0) {
          setEnded(true);
          setLive(false);
        } else if (live0) {
          setLive(true);
          setEnded(false);
        } else {
          setLive(false);
          setEnded(false);
        }

        setStartLocal(toLocalInput(cfg.start));
        setInfo(cfg.info || "");

        // WICHTIG: für <input type="date"> brauchen wir "YYYY-MM-DD"
        const hydratedShifts =
          (cfg.shifts || []).map((s) => ({
            ...s,
            date: toDateInput(s.date),
          })) as Shift[];

        setShifts(hydratedShifts);
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
        date: toDateInput(new Date().toISOString()),
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
      // Datum von "YYYY-MM-DD" → echte ISO, sonst wird’s serverseitig oft verworfen
      const normalizedShifts: Shift[] = (live ? shifts : []).map((s) => ({
        ...s,
        date: /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? fromDateInputToIso(s.date) : new Date(s.date).toISOString(),
      }));

      const body: Partial<Cfg> = {
        live,
        ended,
        start: !live && !ended && startLocal ? toIso(startLocal) : null,
        info,
        shifts: live ? normalizedShifts : [],
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

/* ---------- Login + Wrapper ---------- */
export default function AdminPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [fadeIn, setFadeIn] = useState(false);

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

  const page: CSSProperties = {
    minHeight: "100vh",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    fontSize: 16,
    fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  };
  const card: CSSProperties = {
    width: "100%",
    maxWidth: 480,
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(20px)",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    padding: 24,
    transition: "opacity 0.35s ease, transform 0.35s ease",
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? "translateY(0px)" : "translateY(12px)",
  };
  const h1: CSSProperties = { fontSize: 22, fontWeight: 600, margin: "16px 0 20px", textAlign: "center" };

  if (!loggedIn) {
    return (
      <main style={page}>
        <div style={{ ...card, maxWidth: 420 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Image src="/tst-logo.png" alt="TST Logo" width={200} height={200} priority />
          </div>

          <h1 style={h1}>Admin Login</h1>

          <form
            onSubmit={handleLogin}
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ width: "90%" }}>
              <label
                style={{
                  display: "block",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Benutzername
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                }}
              />
            </div>

            <div style={{ width: "90%" }}>
              <label
                style={{
                  display: "block",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Passwort
              </label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                }}
              />
              {error && (
                <div style={{ color: "#dc2626", fontSize: 13, marginTop: 4, textAlign: "left", width: "100%" }}>
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: "90%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                background: "#d70080",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(215,0,128,0.25)",
                marginTop: "4px",
              }}
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

  return (
    <main style={page}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image src="/tst-logo.png" alt="TST Logo" width={200} height={200} priority />
        </div>

        <h2 style={{ ...h1, marginTop: 8 }}>Inventur-Einstellungen</h2>
        <ConfigForm onLogout={handleLogout} />
      </div>
    </main>
  );
}
