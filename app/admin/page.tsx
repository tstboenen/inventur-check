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

  // ---------- Login-Ansicht ----------
  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-gray-200 shadow-xl rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/tst-logo.png"
              alt="TST Logo"
              width={96}
              height={96}
              className="opacity-90"
              priority
            />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Admin Login</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Benutzername</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Passwort</label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 text-white font-semibold py-2.5 hover:bg-gray-800 transition"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            Zugriff nur für autorisierte Mitarbeiter.
          </p>
        </div>
      </main>
    );
  }

  // ---------- Panel-Ansicht (nach Login) ----------
  return (
    <main className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-2xl p-6 sm:p-8 text-center">
        <div className="flex flex-col items-center mb-4">
          <Image
            src="/tst-logo.png"
            alt="TST Logo"
            width={96}
            height={96}
            className="opacity-90"
            priority
          />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Willkommen im Adminbereich</h2>
        <p className="text-gray-600 mb-6">✅ Erfolgreich eingeloggt.</p>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-gray-900 text-white font-semibold py-2.5 px-4 hover:bg-gray-800 transition"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
