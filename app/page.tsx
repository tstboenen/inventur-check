// app/page.tsx
'use client';

import Image from 'next/image';
import './home.css'; // <--- hier einbinden

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
    </main>
  );
}
