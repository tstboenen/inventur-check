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
    <main
      className="flex flex-col items-center justify-center min-h-screen text-gray-900"
      style={{
        backgroundColor: "white",
        backgroundImage: "none",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.8)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
          border: "1px solid rgba(255,255,255,0.3)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
        className="flex flex-col items-center rounded-2xl p-8 w-full max-w-sm"
      >
        <Image
          src="/tst-logo.png"
          alt="TST Logo"
          width={100}
          height={100}
          className="mb-6 opacity-90"
        />

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
            className="bg-black hover:bg-gray-800 text-white font-semibold py-2 rounded-lg transition-all"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
