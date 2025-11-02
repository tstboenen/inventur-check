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

  // ---- gemeinsame Styles ----
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 420,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: 24,
    textAlign: "center",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    margin: "16px 0 20px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    outline: "none",
    fontSize: 14,
    transition: "box-shadow .15s ease",
  };

  const inputWrapStyle: React.CSSProperties = { marginBottom: 14 };

  const buttonStyle: React.CSSProperties = {
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

  const smallNote: React.CSSProperties = {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
  };

  const errorStyle: React.CSSProperties = {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 4,
    textAlign: "left",
  };

  // -------- Login-Ansicht --------
  if (!loggedIn) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Image
              src="/tst-logo.png"
              alt="TST Logo"
              width={90}
              height={90}
              priority
              style={{ opacity: 0.95 }}
            />
          </div>

          <h1 style={titleStyle}>Admin Login</h1>

          <form onSubmit={handleLogin} style={{ textAlign: "left" }}>
            <div style={inputWrapStyle}>
              <label style={labelStyle}>Benutzername</label>
              <input
                type="text"
                style={inputStyle}
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div style={inputWrapStyle}>
              <label style={labelStyle}>Passwort</label>
              <input
                type="password"
                style={inputStyle}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
              />
              {error ? <div style={errorStyle}>{error}</div> : null}
            </div>

            <button type="submit" style={buttonStyle}>
              Login
            </button>
          </form>

          <div style={smallNote}>Zugriff nur für autorisierte Mitarbeiter.</div>
        </div>
      </main>
    );
  }

  // -------- Panel-Ansicht nach Login --------
  return (
    <main style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 520 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/tst-logo.png"
            alt="TST Logo"
            width={90}
            height={90}
            priority
            style={{ opacity: 0.95 }}
          />
        </div>

        <h2 style={titleStyle}>Willkommen im Adminbereich</h2>
        <p style={{ color: "#6b7280", marginBottom: 18 }}>✅ Erfolgreich eingeloggt.</p>

        <button onClick={handleLogout} style={buttonStyle}>
          Logout
        </button>
      </div>
    </main>
  );
}
