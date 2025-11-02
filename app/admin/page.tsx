"use client";
import { useState } from "react";
import Image from "next/image";

export default function AdminPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(
    typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true"
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass }),
    });
    if (res.ok) {
      localStorage.setItem("isLoggedIn", "true");
      setLoggedIn(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Falsche Zugangsdaten");
    }
  }

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    setLoggedIn(false);
  }

  // gemeinsame Styles
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  };
  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 420,                 // schmale, saubere Card
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
    padding: 24,
    boxSizing: "border-box",
  };
  const h1: React.CSSProperties = { fontSize: 22, fontWeight: 600, margin: "16px 0 20px", textAlign: "center" };
  const label: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 };
  const fieldWrap: React.CSSProperties = { marginBottom: 14 };
  const input: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    outline: "none",
    fontSize: 14,
    lineHeight: "20px",
    boxSizing: "border-box",       // <<< verhindert Überlauf
  };
  const btn: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
  };
  const err: React.CSSProperties = { color: "#dc2626", fontSize: 13, marginTop: 4 };
  const note: React.CSSProperties = { marginTop: 10, fontSize: 12, color: "#6b7280", textAlign: "center" };

  // Login
  if (!loggedIn) {
    return (
      <main style={page}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Image
              src="/tst-logo.png"
              alt="TST Logo"
              width={120}              // <<< größer & dezent
              height={120}
              priority
              style={{ opacity: 0.95 }}
            />
          </div>

          <h1 style={h1}>Admin Login</h1>

          <form onSubmit={handleLogin}>
            <div style={fieldWrap}>
              <label style={label}>Benutzername</label>
              <input
                type="text"
                style={input}
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div style={fieldWrap}>
              <label style={label}>Passwort</label>
              <input
                type="password"
                style={input}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
              />
              {error ? <div style={err}>{error}</div> : null}
            </div>

            <button type="submit" style={btn}>Login</button>
          </form>

          <div style={note}>Zugriff nur für autorisierte Mitarbeiter.</div>
        </div>
      </main>
    );
  }

  // Panel nach Login
  return (
    <main style={page}>
      <div style={{ ...card, maxWidth: 520, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image src="/tst-logo.png" alt="TST Logo" width={120} height={120} priority style={{ opacity: 0.95 }} />
        </div>
        <h2 style={{ ...h1, marginTop: 12 }}>Willkommen im Adminbereich</h2>
        <p style={{ color: "#6b7280", margin: "0 0 18px" }}>✅ Erfolgreich eingeloggt.</p>
        <button onClick={handleLogout} style={btn}>Logout</button>
      </div>
    </main>
  );
}
