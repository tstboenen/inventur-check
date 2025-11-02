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
      setError(data.error || "Falsche Zugangsdaten");
    }
  }

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-800">
        <img
          src="/tst-logo.png"
          alt="TST Logo"
          className="w-48 mb-6"
        />
        <h1 className="text-2xl font-bold mb-4 text-[#00aeef]">
          Admin Login
        </h1>

        <form
          onSubmit={handleLogin}
          className="bg-white border border-gray-300 rounded-2xl p-8 shadow-lg w-80 flex flex-col gap-4"
        >
          <input
            type="text"
            placeholder="Benutzername"
            className="p-2 border border-[#00aeef] rounded focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            type="password"
            placeholder="Passwort"
            className="p-2 border border-[#00aeef] rounded focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          {error && <p className="text-[#d70080] text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-[#d70080] hover:bg-[#b00068] text-white font-semibold py-2 rounded transition"
          >
            Login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-800">
      <img
        src="/tst-logo.png"
        alt="TST Logo"
        className="w-48 mb-6"
      />
      <h1 className="text-2xl font-bold mb-4 text-[#00aeef]">
        Willkommen im Adminbereich
      </h1>
      <p className="mb-6 text-gray-600">✅ Erfolgreich eingeloggt.</p>
      <button
        onClick={handleLogout}
        className="bg-[#d70080] hover:bg-[#b00068] text-white font-semibold py-2 px-4 rounded transition"
      >
        Logout
      </button>
    </main>
  );
}
