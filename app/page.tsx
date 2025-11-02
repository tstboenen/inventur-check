// app/page.tsx
'use client';

import Image from 'next/image';

export default function Page() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <Image
        src="/tst-logo.png" // Datei in /public/tst-logo.png ablegen
        alt="TST Logistics"
        width={400}
        height={400}
        priority
        className="h-auto"
      />
    </main>
  );
}
