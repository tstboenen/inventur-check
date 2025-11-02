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
      <main className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 px-4">
        {/* Logo oben */}
        <div className="absolute top-6 flex justify-center w-full">
          <Image
            src="/tst-logo.png"
            alt="TST Logo"
            width={90}
            height={90}
            className="opacity-90 sm:w-[100px] sm:h-[100px]"
          />
        </div>

        {/* Login-Karte */}
        <div className="mt-28 bg-white border border-gray-200 shadow-xl rounded-2xl p-6 sm:p-10 w-full max-w-xs sm:max-w-sm text-center">
          <h1 className="text-2xl font-semibold mb-6 text-gray-800">
            Admin Login
          </h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Benutzername"
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
            <input
              type="password"
              placeholder="Passwort"
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 rounded-lg transition-all duration-150 shadow-sm"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 px-4">
      <div className="absolute top-6 flex justify-center w-full">
        <Image
          src="/tst-logo.png"
          alt="TST Logo"
          width={90}
          height={90}
          className="opacity-90 sm:w-[100px] sm:h-[100px]"
        />
      </div>

      <div className="mt-28 bg-white border border-gray-200 shadow-xl rounded-2xl p-6 sm:p-10 w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">
          Willkommen im Adminbereich
        </h1>
        <p className="mb-6 text-gray-600">✅ Erfolgreich eingeloggt.</p>
        <button
          onClick={handleLogout}
          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-150 shadow-sm"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
