// app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';
// Optional: Edge-Runtime (empfohlen mit KV)
// export const runtime = 'edge';

type Settings = {
  textVorStart: string;
  startZeit: string | null; // ISO, z. B. "2025-11-14T14:15:00+01:00"
};

const SETTINGS_KEY = 'inventur:settings';

function normalizeSettings(data: Record<string, string> | null): Settings {
  return {
    textVorStart: data?.textVorStart ?? 'Text vor Start',
    startZeit: data?.startZeit ?? null,
  };
}

function isIsoLike(s: unknown) {
  if (typeof s !== 'string') return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

export async function GET() {
  const raw = await kv.hgetall<Record<string, string>>(SETTINGS_KEY);
  const settings = normalizeSettings(raw);
  return NextResponse.json(settings, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Settings>;

    const textVorStart =
      typeof body.textVorStart === 'string' ? body.textVorStart : 'Text vor Start';

    let startZeit: string | null = null;
    if (body.startZeit === null || body.startZeit === undefined || body.startZeit === '') {
      startZeit = null;
    } else if (isIsoLike(body.startZeit)) {
      startZeit = String(body.startZeit);
    } else {
      return NextResponse.json(
        { error: 'Ungültige startZeit. Bitte ISO-String nutzen (z. B. 2025-11-14T14:15:00+01:00).' },
        { status: 400 }
      );
    }

    await kv.hset(SETTINGS_KEY, { textVorStart, startZeit });
    return NextResponse.json({ textVorStart, startZeit }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request' }, { status: 400 });
  }
}
