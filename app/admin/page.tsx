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
      <main className="flex flex-col items-center justify-center min-h-screen bg-[#00aeef] text-gray-800">
        <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl p-8 w-80 flex flex-col items-center">
          <img
            src="/tst-logo.png"
            alt="TST Logo"
            className="w-40 mb-6 object-contain"
          />
          <h1 className="text-xl font-bold mb-4 text-[#d70080]">
            Admin Login
          </h1>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="Benutzername"
              className="p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
            <input
              type="password"
              placeholder="Passwort"
              className="p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            {error && <p className="text-[#d70080] text-sm">{error}</p>}
            <button
              type="submit"
              className="bg-[#d70080] hover:bg-[#b00068] text-white font-semibold py-2 rounded transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#00aeef] text-gray-800">
      <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl p-8 w-96 text-center">
        <img
          src="/tst-logo.png"
          alt="TST Logo"
          className="w-40 mb-6 object-contain"
        />
        <h1 className="text-2xl font-bold mb-4 text-[#d70080]">
          Willkommen im Adminbereich
        </h1>
        <p className="mb-6 text-gray-600">✅ Erfolgreich eingeloggt.</p>
        <button
          onClick={handleLogout}
          className="bg-[#d70080] hover:bg-[#b00068] text-white font-semibold py-2 px-4 rounded transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
