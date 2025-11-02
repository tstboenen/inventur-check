import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

type Status = "before" | "live" | "ended";

type Cfg = {
  // Steuerung
  live: boolean;
  ended: boolean;

  // Zeiten (optional)
  start: string | null;

  // Texte / Anzeige
  headline: string;
  preText: string;
  liveText: string;
  endText: string;
  info: string;
  showCountdown: boolean;
};

const KEY = "inventur:config";

/* ---------- Helpers ---------- */
const boolFromHash = (v?: string | null) => v === "1";
const boolToHash = (v?: boolean) => (v ? "1" : "0");
const normNull = (v?: string | null) => (v === undefined || v === null || v === "" ? null : v);
const isIso = (s: unknown) => typeof s === "string" && s.length > 0 && !Number.isNaN(new Date(s).getTime());

function toCfgFromHash(h: Record<string, string> | null): Cfg {
  // Rückwärtskompatibilität: evtl. gab es früher "status"
  const legacyStatus = (h?.status as Status | undefined) ?? "before";
  const legacyLive = boolFromHash(h?.live) || legacyStatus === "live" || legacyStatus === "ended";
  const legacyEnded = boolFromHash(h?.ended) || legacyStatus === "ended";

  return {
    live: legacyLive,
    ended: legacyEnded,

    start: normNull(h?.start),

    headline: h?.headline ?? "TST BÖNEN INVENTUR 2025",
    preText: h?.preText ?? "",
    liveText: h?.liveText ?? "",
    endText: h?.endText ?? "✅ Die Inventur ist beendet.",
    info: h?.info ?? "",
    showCountdown: boolFromHash(h?.showCountdown),
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

  let start: string | null = null;
  if (body.start === null || body.start === "" || body.start === undefined) {
    start = null;
  } else if (isIso(body.start)) {
    start = String(body.start);
  } else {
    throw new Error("Ungültiger Termin (ISO erwartet).");
  }

  // Regel: ended => live muss true sein
  const live = _ended ? true : _live;
  const ended = _ended && live;

  return {
    live,
    ended,
    start,

    headline:
      typeof body.headline === "string" && body.headline.trim()
        ? body.headline
        : "TST BÖNEN INVENTUR 2025",
    preText: typeof body.preText === "string" ? body.preText : "",
    liveText: typeof body.liveText === "string" ? body.liveText : "",
    endText:
      typeof body.endText === "string" && body.endText.trim()
        ? body.endText
        : "✅ Die Inventur ist beendet.",
    info: typeof body.info === "string" ? body.info : "",
    showCountdown: typeof body.showCountdown === "boolean" ? body.showCountdown : false,
  };
}

function toHashPayload(cfg: Cfg): Record<string, string> {
  return {
    live: boolToHash(cfg.live),
    ended: boolToHash(cfg.ended),

    start: cfg.start ?? "",

    headline: cfg.headline ?? "",
    preText: cfg.preText ?? "",
    liveText: cfg.liveText ?? "",
    endText: cfg.endText ?? "",
    info: cfg.info ?? "",
    showCountdown: boolToHash(cfg.showCountdown),
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
    // Mappe alten Status auf neue Flags
    const status: Status = parsed.status === "live" || parsed.status === "ended" ? parsed.status : "before";
    const live = status === "live" || status === "ended" || !!parsed.live;
    const ended = status === "ended" || !!parsed.ended;

    const cfg: Cfg = {
      live,
      ended,
      start: parsed.start ?? null,
      headline: parsed.headline ?? "TST BÖNEN INVENTUR 2025",
      preText: parsed.preText ?? "",
      liveText: parsed.liveText ?? "",
      endText: parsed.endText ?? "✅ Die Inventur ist beendet.",
      info: parsed.info ?? "",
      showCountdown: !!parsed.showCountdown,
    };
    return NextResponse.json(cfg, { headers: { "Cache-Control": "no-store" } });
  }

  // 3) Default
  const empty: Cfg = {
    live: false,
    ended: false,
    start: null,
    headline: "TST BÖNEN INVENTUR 2025",
    preText: "",
    liveText: "",
    endText: "✅ Die Inventur ist beendet.",
    info: "",
    showCountdown: false,
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
