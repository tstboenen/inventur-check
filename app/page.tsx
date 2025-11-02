// app/page.tsx
'use client';

import Image from 'next/image';
import './home.css';

export default function Page() {
  return (
    <main className="main-container">
      <Image
        src="/tst-logo.png"
        alt="TST Logistics"
        width={400}
        height={400}
        priority
        className="main-logo"
      />

      <h1 className="main-title">TST BÖNEN INVENTUR 2025</h1>
    </main>
  );
}
