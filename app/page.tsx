// app/page.tsx
import Image from 'next/image';
import './home.css';
import ClientCountdown from './ClientCountdown';

export const dynamic = 'force-dynamic';

async function getSettings() {
  const res = await fetch('/api/settings', { cache: 'no-store' });
  if (!res.ok) return { textVorStart: 'Text vor Start', startZeit: null };
  return res.json();
}

export default async function Page() {
  const { textVorStart, startZeit } = await getSettings();

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

      <ClientCountdown textVorStart={textVorStart ?? 'Text vor Start'} startZeit={startZeit} />
    </main>
  );
}
