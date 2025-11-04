import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

type Shift = {
  type: "Früh" | "Spät" | "Nacht";
  date: string;
  status: "Muss arbeiten" | "Hat frei";
};

type Cfg = {
  live: boolean;
  ended: boolean;
  start: string | null;
  info: string;
  shifts: Shift[];
};

const KEY = "inventur:config_v2"; // neues, sicheres JSON-Format

/* ---------- Hilfsfunktionen ---------- */
function isIso(s: unknown) {
  return typeof s === "string" && !Number.isNaN(new Date(s).getTime());
}

function maybeParseJson<T = any>(v: unknown): T | null {
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

function sanitize(body: any): Cfg {
  const live = !!body.live;
  const ended = !!body.ended;
  const start =
    !live && !ended && typeof body.start === "string" && isIso(body.start)
      ? body.start
      : null;
  const info = typeof body.info === "string" ? body.info : "";
  const shifts =
    Array.isArray(body.shifts) && body.shifts.length
      ? body.shifts.filter(
          (s: any) =>
            s &&
            ["Früh", "Spät", "Nacht"].includes(s.type) &&
            typeof s.date === "string" &&
            ["Muss arbeiten", "Hat frei"].includes(s.status)
        )
      : [];
  return { live, ended, start, info, shifts };
}

/* ---------- GET ---------- */
export async function GET() {
  // zuerst JSON-Variante lesen
  const raw = await kv.get<string>(KEY);
  if (raw) {
    const parsed = maybeParseJson<Cfg>(raw);
    if (parsed)
      return NextResponse.json(parsed, {
        headers: { "Cache-Control": "no-store" },
      });
  }

  // Fallback: leere Default-Konfiguration
  const empty: Cfg = { live: false, ended: false, start: null, info: "", shifts: [] };
  return NextResponse.json(empty, { headers: { "Cache-Control": "no-store" } });
}

/* ---------- POST ---------- */
export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const ok = /(^|;\s*)admin_session=ok(;|$)/.test(cookie);
  if (!ok)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const cfg = sanitize(body);

    // direkt als JSON speichern (kein Hash)
    await kv.set(KEY, JSON.stringify(cfg));

    // zurückgeben, was tatsächlich gespeichert wurde
    return NextResponse.json(cfg, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Ungültiger Request" },
      { status: 400 }
    );
  }
}
