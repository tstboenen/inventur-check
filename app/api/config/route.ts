import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

type Cfg = {
  live: boolean;
  ended: boolean;
  start: string | null; // ISO oder null
  info: string;         // optionaler Infotext
};

const KEY = "inventur:config";

/* ---------- Helpers ---------- */
const boolFromHash = (v?: string | null) => v === "1";
const boolToHash = (v?: boolean) => (v ? "1" : "0");
const normNull = (v?: string | null) => (v === undefined || v === null || v === "" ? null : v);
const isIso = (s: unknown) => typeof s === "string" && s.length > 0 && !Number.isNaN(new Date(s).getTime());

function toCfgFromHash(h: Record<string, string> | null): Cfg {
  // Legacy-Mapping falls alte Keys existieren
  return {
    live: boolFromHash(h?.live) || (h?.status === "live" || h?.status === "ended"),
    ended: boolFromHash(h?.ended) || h?.status === "ended",
    start: normNull(h?.start),
    info: h?.info ?? "",
  };
}

function maybeParseJson<T = any>(val: unknown): T | null {
  if (typeof val !== "string") return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

function sanitizeInput(body: Partial<Cfg>): Cfg {
  const _live = typeof body.live === "boolean" ? body.live : false;
  const _ended = typeof body.ended === "boolean" ? body.ended : false;

  // Regel: Ende impliziert Live
  const live = _ended ? true : _live;
  const ended = _ended && live;

  // Termin nur zulassen, wenn weder live noch ended aktiv ist
  let start: string | null = null;
  const allowStart = !live && !ended;
  if (allowStart) {
    if (body.start === null || body.start === "" || body.start === undefined) {
      start = null;
    } else if (isIso(body.start)) {
      start = String(body.start);
    } else {
      throw new Error("Ungültiger Termin (ISO erwartet).");
    }
  } else {
    start = null;
  }

  return {
    live,
    ended,
    start,
    info: typeof body.info === "string" ? body.info : "",
  };
}

function toHashPayload(cfg: Cfg): Record<string, string> {
  return {
    live: boolToHash(cfg.live),
    ended: boolToHash(cfg.ended),
    start: cfg.start ?? "",
    info: cfg.info ?? "",
  };
}

/* ---------- GET ---------- */
export async function GET() {
  // 1) Hash bevorzugt
  const hash = await kv.hgetall<Record<string, string>>(KEY);
  if (hash && Object.keys(hash).length > 0) {
    return NextResponse.json(toCfgFromHash(hash), { headers: { "Cache-Control": "no-store" } });
  }

  // 2) Legacy JSON (falls vorhanden)
  const legacy = await kv.get(KEY);
  const parsed = maybeParseJson<Record<string, any>>(legacy);
  if (parsed && typeof parsed === "object") {
    const live = !!parsed.live || parsed.status === "live" || parsed.status === "ended";
    const ended = !!parsed.ended || parsed.status === "ended";
    const cfg: Cfg = {
      live,
      ended,
      start: parsed.start ?? null,
      info: parsed.info ?? "",
    };
    return NextResponse.json(cfg, { headers: { "Cache-Control": "no-store" } });
  }

  // 3) Default
  const empty: Cfg = {
    live: false,
    ended: false,
    start: null,
    info: "",
  };
  return NextResponse.json(empty, { headers: { "Cache-Control": "no-store" } });
}

/* ---------- POST ---------- */
export async function POST(req: Request) {
  // Session prüfen (Cookie von /api/login)
  const cookie = req.headers.get("cookie") || "";
  const ok = /(^|;\s*)admin_session=ok(;|$)/.test(cookie);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as Partial<Cfg>;
    const cfg = sanitizeInput(body);
    const payload = toHashPayload(cfg);

    try {
      await kv.hset(KEY, payload);
    } catch (err: any) {
      if (String(err?.message || "").includes("WRONGTYPE")) {
        await kv.del(KEY);
        await kv.hset(KEY, payload);
      } else {
        throw err;
      }
    }

    return NextResponse.json(cfg, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Ungültiger Request" }, { status: 400 });
  }
}
