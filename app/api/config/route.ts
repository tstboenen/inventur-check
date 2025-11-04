import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

/* ---------- Typen ---------- */
type Shift = {
  type: "Früh" | "Spät" | "Nacht";
  date: string; // "YYYY-MM-DD"
  status: "Muss arbeiten" | "Hat frei";
};

type Cfg = {
  live: boolean;
  ended: boolean;
  start: string | null; // ISO
  info: string;
  shifts?: Shift[];
};

const KEY = "inventur:config";

/* ---------- Helpers ---------- */
const boolFromHash = (v?: string | null) => v === "1";
const boolToHash = (v?: boolean) => (v ? "1" : "0");
const normNull = (v?: string | null) =>
  v === undefined || v === null || v === "" ? null : v;
const isIso = (s: unknown) =>
  typeof s === "string" && s.length > 0 && !Number.isNaN(new Date(s).getTime());

function maybeParseJson<T = any>(val: unknown): T | null {
  if (typeof val !== "string") return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

/* ---------- Mapping ---------- */
function toCfgFromHash(h: Record<string, string> | null): Cfg {
  return {
    live: boolFromHash(h?.live),
    ended: boolFromHash(h?.ended),
    start: normNull(h?.start),
    info: h?.info ?? "",
    shifts: h?.shifts ? (maybeParseJson<Shift[]>(h.shifts) ?? []) : [],
  };
}

/* ---------- Input-Validierung ---------- */
function sanitizeInput(body: Partial<Cfg>): Cfg {
  const _live = typeof body.live === "boolean" ? body.live : false;
  const _ended = typeof body.ended === "boolean" ? body.ended : false;

  // Ende impliziert live (Geschäftslogik)
  const live = _ended ? true : _live;
  const ended = _ended && live;

  // Termin nur, wenn weder live noch ended
  let start: string | null = null;
  const allowStart = !live && !ended;
  if (allowStart && isIso(body.start)) start = String(body.start);

  // Shifts robust annehmen (Array oder JSON-String), NICHT an live koppeln,
  // damit Tests leichter sind; leeres/fehlendes -> []
  let shifts: Shift[] = [];
  if (Array.isArray(body.shifts)) {
    shifts = body.shifts.filter(
      (s: any) =>
        s &&
        (s.type === "Früh" || s.type === "Spät" || s.type === "Nacht") &&
        typeof s.date === "string" &&
        (s.status === "Muss arbeiten" || s.status === "Hat frei")
    );
  } else if (typeof (body as any).shifts === "string") {
    const parsed = maybeParseJson<Shift[]>((body as any).shifts);
    if (Array.isArray(parsed)) {
      shifts = parsed.filter(
        (s: any) =>
          s &&
          (s.type === "Früh" || s.type === "Spät" || s.type === "Nacht") &&
          typeof s.date === "string" &&
          (s.status === "Muss arbeiten" || s.status === "Hat frei")
      );
    }
  } else if (body.shifts === undefined) {
    // wenn der Client nichts schickt, behalten wir NICHT automatisch alte Werte bei,
    // sondern setzen [] (explizit). So ist das Verhalten klar.
    shifts = [];
  }

  return { live, ended, start, info: typeof body.info === "string" ? body.info : "", shifts };
}

/* ---------- Hash-Payload ---------- */
function toHashPayload(cfg: Cfg): Record<string, string> {
  return {
    live: boolToHash(cfg.live),
    ended: boolToHash(cfg.ended),
    start: cfg.start ?? "",
    info: cfg.info ?? "",
    shifts: JSON.stringify(cfg.shifts ?? []), // immer String in KV
  };
}

/* ---------- GET ---------- */
export async function GET() {
  const hash = await kv.hgetall<Record<string, string>>(KEY);
  if (hash && Object.keys(hash).length > 0) {
    return NextResponse.json(toCfgFromHash(hash), { headers: { "Cache-Control": "no-store" } });
  }

  // Fallback auf Legacy-JSON (falls alt)
  const legacy = await kv.get(KEY);
  const parsed = maybeParseJson<Record<string, any>>(legacy);
  if (parsed && typeof parsed === "object") {
    const cfg: Cfg = {
      live: !!parsed.live,
      ended: !!parsed.ended,
      start: parsed.start ?? null,
      info: parsed.info ?? "",
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
    };
    return NextResponse.json(cfg, { headers: { "Cache-Control": "no-store" } });
  }

  // Default
  const empty: Cfg = { live: false, ended: false, start: null, info: "", shifts: [] };
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
      // Falls KEY vorher als String existierte (Legacy), löschen & neu anlegen
      if (String(err?.message || "").includes("WRONGTYPE")) {
        await kv.del(KEY);
        await kv.hset(KEY, payload);
      } else {
        throw err;
      }
    }

    // WICHTIG: nach dem Speichern direkt den tatsächlich gespeicherten Zustand zurückgeben
    const saved = await kv.hgetall<Record<string, string>>(KEY);
    return NextResponse.json(toCfgFromHash(saved), { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Ungültiger Request" }, { status: 400 });
  }
}
