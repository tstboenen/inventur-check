"use client";
import { useState } from "react";

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
      const data = await res.json();
      setError(data.error || "Fehler beim Login");
    }
  }

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-[#0e1628] text-white">
        <h1 className="text-3xl font-bold mb-6">🗝️ Admin Login</h1>
        <form
          onSubmit={handleLogin}
          className="bg-[#1c2540] p-6 rounded-2xl shadow-md w-80 flex flex-col gap-4"
        >
          <input
            type="text"
            placeholder="Benutzername"
            className="p-2 rounded bg-[#0e1628] border border-gray-600"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            type="password"
            placeholder="Passwort"
            className="p-2 rounded bg-[#0e1628] border border-gray-600"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 rounded p-2 font-semibold"
          >
            Login
          </button>
        </form>
      </main>
    );
  }

  // Nach Login: hier später das richtige Admin-Panel einbauen
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#0e1628] text-white">
      <h1 className="text-3xl font-bold mb-4">Inventur-Admin</h1>
      <p className="mb-6">✅ Erfolgreich eingeloggt.</p>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 rounded p-2 font-semibold"
      >
        Logout
      </button>
    </main>
  );
}
