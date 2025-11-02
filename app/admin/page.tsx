"use client";
import { useState } from "react";
import Image from "next/image";

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass }),
    });
    if (!res.ok) setError("Falsche Zugangsdaten");
    else window.location.reload();
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900">
      <div className="flex flex-col items-center bg-white shadow-xl border border-gray-200 rounded-2xl p-8 w-full max-w-sm">
        {/* Logo */}
        <Image
          src="/tst-logo.png"
          alt="TST Logo"
          width={120}
          height={120}
          className="mb-6 opacity-90"
        />

        {/* Login */}
        <h1 className="text-2xl font-semibold mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
          <input
            type="text"
            placeholder="Benutzername"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            type="password"
            placeholder="Passwort"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 rounded-lg transition-all"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
