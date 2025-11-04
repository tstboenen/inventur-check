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
  shifts?: Shift[];
};

const KEY = "inventur:config";

/* ---------- Helpers ---------- */
const boolFromHash = (v?: string | null) => v === "1";
const boolToHash = (v?: boolean) => (v ? "1" : "0");
const normNull = (v?: string | null) => (v === undefined || v === null || v === "" ? null : v);
const isIso = (s: unknown) => typeof s === "string" && s.length > 0 && !Number.isNaN(new Date(s).getTime());

function toCfgFromHash(h: Record<string, string> | null): Cfg {
  return {
    live: boolFromHash(h?.live),
    ended: boolFromHash(h?.ended),
    start: normNull(h?.start),
    info: h?.info ?? "",
    shifts: h?.shifts ? maybeParseJson<Shift[]>(h.shifts) || [] : [],
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

  const live = _ended ? true : _live;
  const ended = _ended && live;

  let start: string | null = null;
  const allowStart = !live && !ended;
  if (allowStart && isIso(body.start)) {
    start = String(body.start);
  }

  let shifts: Shift[] = [];
  if (live && Array.isArray(body.shifts)) {
    shifts = body.shifts
      .filter(
        (s) =>
          typeof s?.type === "string" &&
          typeof s?.date === "string" &&
          typeof s?.status === "string"
      )
      .map((s) => ({
        type: s.type as Shift["type"],
        date: s.date,
        status: s.status as Shift["status"],
      }));
  }

  return {
    live,
    ended,
    start,
    info: typeof body.info === "string" ? body.info : "",
    shifts,
  };
}

function toHashPayload(cfg: Cfg): Record<string, string> {
  return {
    live: boolToHash(cfg.live),
    ended: boolToHash(cfg.ended),
    start: cfg.start ?? "",
    info: cfg.info ?? "",
    shifts: JSON.stringify(cfg.shifts ?? []),
  };
}

/* ---------- GET ---------- */
export async function GET() {
  const hash = await kv.hgetall<Record<string, string>>(KEY);
  if (hash && Object.keys(hash).length > 0) {
    return NextResponse.json(toCfgFromHash(hash), { headers: { "Cache-Control": "no-store" } });
  }

  const legacy = await kv.get(KEY);
  const parsed = maybeParseJson<Record<string, any>>(legacy);
  if (parsed && typeof parsed === "object") {
    const cfg: Cfg = {
      live: !!parsed.live,
      ended: !!parsed.ended,
      start: parsed.start ?? null,
      info: parsed.info ?? "",
      shifts: parsed.shifts ?? [],
    };
    return NextResponse.json(cfg, { headers: { "Cache-Control": "no-store" } });
  }

  const empty: Cfg = { live: false, ended: false, start: null, info: "", shifts: [] };
  return NextResponse.json(empty, { headers: { "Cache-Control": "no-store" } });
}

/* ---------- POST ---------- */
export async function POST(req: Request) {
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
