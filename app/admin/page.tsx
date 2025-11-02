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
    maxWidth: 420,
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    padding: 28,
    boxSizing: "border-box",
    textAlign: "center",
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

  const input: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    outline: "none",
    fontSize: 14,
    lineHeight: "20px",
    boxSizing: "border-box",
  };

  const button: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "#d70080", // <<< TST-Pink
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
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

  // Button Hover-State Handling
  const [hover, setHover] = useState(false);

  // -------- Login --------
  if (!loggedIn) {
    return (
      <main style={page}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Image
              src="/tst-logo.png"
              alt="TST Logo"
              width={140} // <<< größer
              height={140}
              priority
              style={{ opacity: 0.95 }}
            />
          </div>

          <h1 style={h1}>Admin Login</h1>

          <form onSubmit={handleLogin}>
            <div style={inputWrap}>
              <label style={label}>Benutzername</label>
              <input
                type="text"
                style={input}
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
              />
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

          <div style={note}>Zugriff nur für autorisierte Mitarbeiter.</div>
        </div>
      </main>
    );
  }

  // -------- Panel nach Login --------
  return (
    <main style={page}>
      <div style={{ ...card, maxWidth: 520 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/tst-logo.png"
            alt="TST Logo"
            width={140}
            height={140}
            priority
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
      </div>
    </main>
  );
}
