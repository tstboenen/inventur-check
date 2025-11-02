// app/page.tsx
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Page() {
  const [adminText, setAdminText] = useState<string>('Text vor Start');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('textVorStart');
      if (stored && stored.trim().length > 0) {
        setAdminText(stored);
      }
    } catch {
      // falls localStorage nicht verfügbar ist, bleibt der Fallback
    }
  }, []);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-3xl text-center">
        {/* Logo zentriert */}
        <div className="flex justify-center mb-8">
          <Image
            src="/tst-logo.png" // Logo in /public/tst-logo.png ablegen
            alt="TST Logistics"
            width={400}
            height={400}
            priority
            className="h-auto w-[300px] sm:w-[360px] md:w-[400px]"
          />
        </div>

        {/* Neuer Titel */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
          TST Bönen Inventur 2025
        </h1>

        {/* Admin-Text */}
        <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 mx-auto">
          {adminText}
        </p>
      </div>
    </main>
  );
}
