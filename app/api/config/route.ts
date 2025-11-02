import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

type Cfg = {
  start: string | null;
  end: string | null;
  preText: string;
  liveText: string;
  info: string;
};

const KEY = "inventur:config";

function normalize(data: Record<string, string> | null): Cfg {
  return {
    start: data?.start ?? null,
    end: data?.end ?? null,
    preText: data?.preText ?? "",
    liveText: data?.liveText ?? "",
    info: data?.info ?? "",
  };
}

function isIso(s: unknown) {
  if (typeof s !== "string" || !s) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

export async function GET() {
  const raw = await kv.hgetall<Record<string, string>>(KEY);
  return NextResponse.json(normalize(raw), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  // Nur mit gültiger Session erlauben
  const cookie = req.headers.get("cookie") || "";
  const ok = /(^|;\s*)admin_session=ok(;|$)/.test(cookie);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as Partial<Cfg>;

    // Validierung
    const start =
      body.start === null || body.start === "" || body.start === undefined
        ? null
        : isIso(body.start)
        ? String(body.start)
        : (() => {
            throw new Error("Ungültige Startzeit (ISO erwartet).");
          })();

    const end =
      body.end === null || body.end === "" || body.end === undefined
        ? null
        : isIso(body.end)
        ? String(body.end)
        : (() => {
            throw new Error("Ungültige Endzeit (ISO erwartet).");
          })();

    const preText = typeof body.preText === "string" ? body.preText : "";
    const liveText = typeof body.liveText === "string" ? body.liveText : "";
    const info = typeof body.info === "string" ? body.info : "";

    await kv.hset(KEY, { start, end, preText, liveText, info });

    return NextResponse.json(
      { start, end, preText, liveText, info },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Ungültiger Request" }, { status: 400 });
  }
}
